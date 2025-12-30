import { EventEmitter } from 'node:events'
import { jwtDecode } from 'jwt-decode'
import { exchangeToken } from './api-endpoints/auth.js'

const AUTO_REFRESH_RETRY_BASE_SECONDS = 5
const AUTO_REFRESH_RETRY_MAX_SECONDS = 300

/**
 * @typedef {Object} RefreshableTokenOpts
 * @property {string} clientId - OAuth client ID
 * @property {string} refreshToken - OAuth refresh token
 * @property {string} accessToken - Initial OAuth access token (JWT)
 * @property {OnTokenRefreshHandler} onTokenRefresh - A function that will receive the refreshed token info and perisist it for future use
 * @property {number} [bufferSeconds=30] - Seconds before expiration to consider token expired
 */

/**
 * This is a REQUIRED function. It gets called after the token is refreshed with new tokens.
 * It should save the new tokens somewhere. When starting back up, re-use the newly perissted tokens.
 * If you loose track of these new tokens, you will effectively be logged out.
 *
 * @typedef {(refreshSuccessEvent: RefreshSuccessEvent) => void | Promise<void>} OnTokenRefreshHandler
 */

/**
 * @typedef {Object} RefreshSuccessEvent
 * @property {string} clientId - The OAuth client ID
 * @property {string} updatedAccessToken - The new access token
 * @property {string} updatedRefreshToken - The refresh token (may be updated)
 * @property {number} updatedExpiresAt - Unix timestamp in seconds when token expires
 * @property {string} prevAccessToken - The accessToken used in to initiate the refresh flow to be discarded
 * @property {string} prevRefreshToken - The refreshToken used in to initiate the refresh flow to be discarded
 * @property {number} prevExpiresAt - The expiresAt for the previous token pair
 */

/**
 * Event map for RefreshableToken
 * @typedef {{
 *   'refresh:start': [],
 *   'refresh:success': [RefreshSuccessEvent],
 *   'refresh:error': [Error],
 *   'invalid': [Error]
 * }} RefreshableTokenEventMap
 */

/**
 * A refreshable OAuth token that automatically refreshes when expired.
 * Handles in-flight refresh deduplication to prevent multiple concurrent refresh requests.
 *
 * Events:
 * - 'refresh:start' - Emitted when token refresh begins
 * - 'refresh:success' - Emitted when token refresh succeeds, passes { clientId, updatedAccessToken, updatedRefreshToken, updatedExpiresAt, prevAccessToken, prevRefreshToken, prevExpiresAt }
 * - 'refresh:error' - Emitted when token refresh fails (transient errors), passes error
 * - 'invalid' - Emitted when refresh token is permanently invalid, passes error
 *
 * @extends {EventEmitter<RefreshableTokenEventMap>}
 */

export class RefreshableToken extends EventEmitter {
  /** @type {string} */
  #clientId
  /** @type {string} */
  #refreshToken
  /** @type {string} */
  #accessToken
  /** @type {number} - Unix timestamp in seconds (from JWT exp claim) */
  #expiresAt
  /** @type {number} - Buffer time in seconds before expiration */
  #bufferSeconds
  /** @type {boolean} */
  #invalid = false
  /** @type {Promise<RefreshSuccessEvent> | null} */
  #inFlightRefresh = null
  /** @type {boolean} */
  #autoRefreshEnabled = true
  /** @type {ReturnType<typeof setTimeout> | null} */
  #autoRefreshTimeout = null
  /** @type {number} */
  #autoRefreshRetryAttempt = 0
  /** @type {OnTokenRefreshHandler} */
  #onTokenRefresh

  /**
   * @param {RefreshableTokenOpts} opts
   */
  constructor ({ clientId, refreshToken, accessToken, bufferSeconds = 30, onTokenRefresh }) {
    super()
    this.#clientId = clientId
    this.#refreshToken = refreshToken
    this.#accessToken = accessToken
    this.#bufferSeconds = bufferSeconds
    this.#onTokenRefresh = onTokenRefresh

    // Decode the JWT to get expiration
    try {
      const decoded = jwtDecode(accessToken)
      if (!decoded.exp) {
        throw new Error('Access token does not contain expiration claim (exp)')
      }
      this.#expiresAt = decoded.exp
    } catch (err) {
      const error = /** @type {Error} */ (err)
      throw new Error(`Failed to decode access token: ${error.message}`)
    }

    this.#scheduleAutoRefresh()
  }

  /**
   * Get a valid access token, refreshing if necessary.
   * @returns {Promise<string>} Valid access token
   * @throws {Error} If token is invalid or refresh fails
   */
  async getAccessToken () {
    // Check if token has been marked invalid
    if (this.#invalid) {
      throw new Error('Token is invalid. Refresh token has expired or been revoked.')
    }

    const now = Math.floor(Date.now() / 1000)
    const needsRefresh = now >= (this.#expiresAt - this.#bufferSeconds)

    if (!needsRefresh) {
      return this.#accessToken
    }

    const { updatedAccessToken } = await this.#refreshAccessToken()
    return updatedAccessToken
  }

  /**
   * Refresh the access token using the refresh token.
   * Handles in-flight request deduplication.
   * @returns {Promise<RefreshSuccessEvent>} New access token
   */
  async #refreshAccessToken () {
    // If a refresh is already in flight, await the existing one
    if (this.#inFlightRefresh) {
      return await this.#inFlightRefresh
    }

    // Create the refresh promise and set it on the class variable
    try {
      this.#inFlightRefresh = this.#performRefresh()
      return await this.#inFlightRefresh
    } finally {
      // Clear the in-flight refresh once done
      this.#inFlightRefresh = null
    }
  }

  /**
   * Perform the actual token refresh.
   * @returns {Promise<RefreshSuccessEvent>} New access token
   */
  async #performRefresh () {
    this.emit('refresh:start')

    try {
      // Snapshot the current tokens
      const prevAccessToken = this.#accessToken
      const prevRefreshToken = this.#refreshToken
      const prevExpiresAt = this.#expiresAt

      const tokens = await exchangeToken({
        grantType: 'refresh_token',
        refreshToken: this.#refreshToken,
        clientId: this.#clientId
      })

      // Update the access token and expiration
      this.#accessToken = tokens.access_token

      // If we got a new refresh token, update it
      if (tokens.refresh_token) {
        this.#refreshToken = tokens.refresh_token
      }

      // Decode the new token to get expiration
      const decoded = jwtDecode(tokens.access_token)
      if (!decoded.exp) {
        throw new Error('Refreshed access token does not contain expiration claim (exp)')
      }
      this.#expiresAt = decoded.exp

      /* @type {RefreshSuccessEvent} */
      const eventPayload = {
        clientId: this.#clientId,
        updatedAccessToken: this.#accessToken,
        updatedRefreshToken: this.#refreshToken,
        updatedExpiresAt: this.#expiresAt,
        prevAccessToken,
        prevRefreshToken,
        prevExpiresAt,
      }

      await this.#onTokenRefresh(eventPayload)

      this.emit('refresh:success', eventPayload)

      this.#autoRefreshRetryAttempt = 0
      this.#scheduleAutoRefresh()

      return eventPayload
    } catch (err) {
      const error = /** @type {any} */ (err)

      // Check for errors that indicate the refresh token is invalid
      const invalidRefreshErrors = [
        'invalid_grant',
        'invalid_token',
        'expired_token',
        'token_expired',
        'refresh_token_expired'
      ]

      if (error.body?.error && invalidRefreshErrors.includes(error.body.error)) {
        // Mark this token as permanently invalid
        this.#invalid = true
        this.#clearAutoRefreshTimeout()
        const statusCode = error.statusCode ? ` (${error.statusCode})` : ''
        const invalidError = new Error(`Refresh token is invalid or expired${statusCode}: ${error.body.error}${error.body.error_description ? ` - ${error.body.error_description}` : ''}`)
        this.emit('invalid', invalidError)
        throw invalidError
      }

      // For other errors, rethrow without marking as invalid (might be transient)
      this.emit('refresh:error', error)
      this.#scheduleAutoRefreshRetry()
      throw error
    }
  }

  /**
   * Stop background token refresh scheduling.
   */
  stopAutoRefresh () {
    this.#autoRefreshEnabled = false
    this.#clearAutoRefreshTimeout()
  }

  /**
   * Start background token refresh scheduling (enabled by default).
   */
  startAutoRefresh () {
    if (this.#invalid) {
      return
    }

    this.#autoRefreshEnabled = true
    this.#autoRefreshRetryAttempt = 0
    this.#scheduleAutoRefresh()
  }

  /**
   * Check if background token refresh scheduling is enabled.
   * @returns {boolean}
   */
  isAutoRefreshEnabled () {
    return this.#autoRefreshEnabled
  }

  /**
   * Get the current OAuth client ID (synchronous).
   * @returns {string}
   */
  get clientId () {
    return this.#clientId
  }

  /**
   * Get the latest access token value (synchronous).
   * Prefer getAccessToken() if you need a guaranteed-valid token in async contexts.
   * @returns {string}
   */
  get accessToken () {
    return this.#accessToken
  }

  /**
   * Schedule the next refresh for when the token becomes stale (expiresAt - bufferSeconds).
   * Uses an unref'd timer so it doesn't keep the process alive.
   */
  #scheduleAutoRefresh () {
    if (!this.#autoRefreshEnabled || this.#invalid) {
      return
    }

    const now = Math.floor(Date.now() / 1000)
    const refreshAt = this.#expiresAt - this.#bufferSeconds
    const delayMs = Math.max(0, (refreshAt - now) * 1000)

    this.#clearAutoRefreshTimeout()
    this.#autoRefreshTimeout = setTimeout(() => {
      this.#autoRefreshTimeout = null
      if (this.#invalid) {
        return
      }

      this.#refreshAccessToken().catch(() => {
        // Errors are emitted by #performRefresh; retries are scheduled there as well.
      })
    }, delayMs)

    this.#autoRefreshTimeout.unref?.()
  }

  #clearAutoRefreshTimeout () {
    if (!this.#autoRefreshTimeout) {
      return
    }

    clearTimeout(this.#autoRefreshTimeout)
    this.#autoRefreshTimeout = null
  }

  #scheduleAutoRefreshRetry () {
    if (!this.#autoRefreshEnabled || this.#invalid) {
      return
    }

    this.#autoRefreshRetryAttempt += 1
    const retrySeconds = Math.min(
      AUTO_REFRESH_RETRY_MAX_SECONDS,
      AUTO_REFRESH_RETRY_BASE_SECONDS * (2 ** (this.#autoRefreshRetryAttempt - 1))
    )

    this.#clearAutoRefreshTimeout()
    this.#autoRefreshTimeout = setTimeout(() => {
      this.#autoRefreshTimeout = null
      if (this.#invalid) {
        return
      }

      this.#refreshAccessToken().catch(() => {
        // Errors are emitted by #performRefresh; retries are scheduled there as well.
      })
    }, retrySeconds * 1000)

    this.#autoRefreshTimeout.unref?.()
  }

  /**
   * Check if the token is currently valid (not expired and not marked invalid).
   * @returns {boolean} True if token is valid
   */
  isValid () {
    if (this.#invalid) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    return now < (this.#expiresAt - this.#bufferSeconds)
  }

  /**
   * Get the expiration timestamp of the current access token.
   * @returns {number} Unix timestamp (seconds since epoch)
   */
  getExpiresAt () {
    return this.#expiresAt
  }

  /**
   * Get the time remaining until token expiration.
   * @returns {number} Seconds until expiration (may be negative if expired)
   */
  getTimeRemaining () {
    const now = Math.floor(Date.now() / 1000)
    return this.#expiresAt - now
  }

  /**
   * Manually trigger a token refresh, regardless of expiration status.
   * Useful for proactive refresh or testing.
   * @returns {Promise<RefreshSuccessEvent>} Token information including clientId, accessToken, refreshToken, and expiresAt
   * @throws {Error} If token is invalid or refresh fails
   */
  async refresh () {
    // Check if token has been marked invalid
    if (this.#invalid) {
      throw new Error('Token is invalid. Refresh token has expired or been revoked.')
    }

    return await this.#refreshAccessToken()
  }
}
