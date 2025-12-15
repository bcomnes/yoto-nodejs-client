/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultHeaders, handleBadResponse, mergeRequestOptions, YotoAPIError } from './helpers.js'
import { DEFAULT_SCOPE, DEFAULT_AUDIENCE, YOTO_LOGIN_URL, DEVICE_CODE_GRANT_TYPE } from './constants.js'

// ============================================================================
// Authentication: Authentication endpoints for browser-based and device flows
// ============================================================================

/**
 * OAuth2 response type for authorization requests
 * @typedef {'code' | 'token' | 'id_token' | 'code token' | 'code id_token' | 'token id_token' | 'code token id_token'} YotoOAuthResponseType
 */

/**
 * OAuth2 prompt parameter for authorization requests
 * @typedef {'none' | 'login' | 'consent' | 'select_account'} YotoOAuthPromptType
 */

/**
 * PKCE code challenge method for authorization requests
 * @typedef {'S256' | 'plain'} YotoOAuthCodeChallengeMethod
 */

/**
 * OAuth2 grant type for token exchange requests
 * @typedef {'authorization_code' | 'refresh_token' | 'client_credentials' | typeof DEVICE_CODE_GRANT_TYPE} YotoOAuthGrantType
 */

/**
 * Redirects the user to Yoto's login page to begin the OAuth2 Authorization Code flow.
 * @see https://yoto.dev/api/get-authorize/
 * @param  {object} options
 * @param  {string} [options.audience='https://api.yotoplay.com']    Audience for the token
 * @param  {string} [options.scope='openid profile offline_access']       Requested scopes
 * @param  {YotoOAuthResponseType} options.responseType  Required response type
 * @param  {string} options.clientId    Required client ID
 * @param  {string} options.redirectUri Required redirect URI
 * @param  {string} options.state       Required opaque value for preventing CSRF attacks
 * @param  {string} [options.nonce]     String value to prevent replay attacks
 * @param  {YotoOAuthPromptType} [options.prompt]  Authorization server prompt behavior
 * @param  {number} [options.maxAge]    Maximum authentication age in seconds
 * @param  {string} [options.codeChallenge]  PKCE code challenge
 * @param  {YotoOAuthCodeChallengeMethod} [options.codeChallengeMethod]  PKCE code challenge method
 * @return {string} The authorization URL to redirect the user to
 */
export function getAuthorizeUrl ({
  audience = DEFAULT_AUDIENCE,
  scope = DEFAULT_SCOPE,
  responseType,
  clientId,
  redirectUri,
  state,
  nonce,
  prompt,
  maxAge,
  codeChallenge,
  codeChallengeMethod
}) {
  const requestUrl = new URL('/authorize', YOTO_LOGIN_URL)

  requestUrl.searchParams.set('audience', audience)
  requestUrl.searchParams.set('scope', scope)
  requestUrl.searchParams.set('response_type', responseType)
  requestUrl.searchParams.set('client_id', clientId)
  requestUrl.searchParams.set('redirect_uri', redirectUri)
  requestUrl.searchParams.set('state', state)

  if (nonce) requestUrl.searchParams.set('nonce', nonce)
  if (prompt) requestUrl.searchParams.set('prompt', prompt)
  if (maxAge !== undefined) requestUrl.searchParams.set('max_age', maxAge.toString())
  if (codeChallenge) requestUrl.searchParams.set('code_challenge', codeChallenge)
  if (codeChallengeMethod) requestUrl.searchParams.set('code_challenge_method', codeChallengeMethod)

  return requestUrl.toString()
}

/**
 * @see https://yoto.dev/api/post-oauth-token/
 * @typedef {Object} YotoTokenResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {string} [refresh_token]
 * @property {string} [scope]
 * @property {string} [id_token]
 * @property {number} [expires_at]
 */

/**
 * Exchange authorization code or refresh token for access tokens.
 * @see https://yoto.dev/api/post-oauth-token/
 * @param  {object} options
 * @param  {YotoOAuthGrantType} options.grantType  Required grant type
 * @param  {string} [options.code]  Authorization code (required for authorization_code grant)
 * @param  {string} [options.redirectUri]  Redirect URI (required for authorization_code grant if used in authorize request)
 * @param  {string} [options.refreshToken]  Refresh token (required for refresh_token grant)
 * @param  {string} [options.clientId]  Client ID
 * @param  {string} [options.clientSecret]  Client secret
 * @param  {string} [options.scope]  Requested scope
 * @param  {string} [options.codeVerifier]  PKCE code verifier (if code_challenge was used)
 * @param  {string} [options.deviceCode]  Device code (required for device_code grant)
 * @param  {string} [options.audience='https://api.yotoplay.com']  Audience for the token
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoTokenResponse>} Token response
 */
export async function exchangeToken ({
  grantType,
  code,
  redirectUri,
  refreshToken,
  clientId,
  clientSecret,
  scope,
  codeVerifier,
  deviceCode,
  audience = DEFAULT_AUDIENCE,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/oauth/token', YOTO_LOGIN_URL)

  const formData = new URLSearchParams()
  formData.set('grant_type', grantType)

  if (grantType === 'authorization_code') {
    if (!code) throw new Error('code is required for authorization_code grant')
    formData.set('code', code)
    if (redirectUri) formData.set('redirect_uri', redirectUri)
    if (codeVerifier) formData.set('code_verifier', codeVerifier)
  } else if (grantType === 'refresh_token') {
    if (!refreshToken) throw new Error('refreshToken is required for refresh_token grant')
    formData.set('refresh_token', refreshToken)
  } else if (grantType === DEVICE_CODE_GRANT_TYPE) {
    if (!deviceCode) throw new Error('deviceCode is required for device_code grant')
    formData.set('device_code', deviceCode)
  }

  if (clientId) formData.set('client_id', clientId)
  if (clientSecret) formData.set('client_secret', clientSecret)
  if (scope) formData.set('scope', scope)
  if (audience) formData.set('audience', audience)

  const headers = {
    ...defaultHeaders({ userAgent }),
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers,
    body: formData.toString()
  }, requestOptions))

  // For device_code grant, always parse JSON first so error details are available
  // 403 errors with authorization_pending/slow_down are expected during polling
  if (grantType === DEVICE_CODE_GRANT_TYPE) {
    /** @type {any} */
    const rawResponse = await response.body.json()

    if (response.statusCode > 299) {
      throw new YotoAPIError(response, rawResponse, { grantType })
    }

    const responseBody = /** @type {YotoTokenResponse} */ (rawResponse)
    return responseBody
  }

  await handleBadResponse(response, { grantType })

  const responseBody = /** @type {YotoTokenResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/post-oauth-device-code/
 * @typedef {Object} YotoDeviceCodeResponse
 * @property {string} device_code - The device verification code
 * @property {string} user_code - The code displayed to the user
 * @property {string} verification_uri - The URL where the user should enter the user_code
 * @property {string} [verification_uri_complete] - The verification URL with the code included
 * @property {number} expires_in - The lifetime of the device code in seconds
 * @property {number} interval - Minimum polling interval in seconds
 */

/**
 * Start the OAuth2 Device Authorization flow for CLI/server-side applications.
 * @see https://yoto.dev/api/post-oauth-device-code/
 * @param  {object} options
 * @param  {string} options.clientId  Required client ID
 * @param  {string} [options.scope='openid profile offline_access']     Requested scopes
 * @param  {string} [options.audience='https://api.yotoplay.com']  Audience for the token
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeviceCodeResponse>} Device code response with user_code and verification_uri
 */
export async function requestDeviceCode ({
  clientId,
  scope = DEFAULT_SCOPE,
  audience = DEFAULT_AUDIENCE,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/oauth/device/code', YOTO_LOGIN_URL)

  const formData = new URLSearchParams()
  formData.set('client_id', clientId)
  formData.set('scope', scope)
  formData.set('audience', audience)

  const headers = {
    ...defaultHeaders({ userAgent }),
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers,
    body: formData.toString()
  }, requestOptions))

  await handleBadResponse(response, { clientId })

  const responseBody = /** @type {YotoDeviceCodeResponse} */ (await response.body.json())
  return responseBody
}

/**
 * Poll result when authorization is still pending
 * @typedef {Object} YotoDevicePollPending
 * @property {'pending'} status - Indicates polling should continue
 * @property {number} interval - Current polling interval in milliseconds
 */

/**
 * Poll result when polling needs to slow down
 * @typedef {Object} YotoDevicePollSlowDown
 * @property {'slow_down'} status - Indicates polling interval should be increased
 * @property {number} interval - New polling interval in milliseconds
 */

/**
 * Poll result when authorization is successful
 * @typedef {Object} YotoDevicePollSuccess
 * @property {'success'} status - Indicates successful authorization
 * @property {YotoTokenResponse} tokens - OAuth tokens
 */

/**
 * Poll result for device authorization flow
 * @typedef {YotoDevicePollPending | YotoDevicePollSlowDown | YotoDevicePollSuccess} YotoDevicePollResult
 */

/**
 * Poll for device authorization completion with automatic error handling (single poll attempt).
 * This function handles common polling errors (authorization_pending, slow_down)
 * and only throws for unrecoverable errors (expired_token, access_denied, etc).
 *
 * Non-blocking - returns immediately with poll result. Suitable for:
 * - Manual polling loops in CLI applications
 * - Server-side endpoints that poll on behalf of clients (e.g., Homebridge UI server)
 * - Custom UI implementations with specific polling behavior
 *
 * For the simplest approach (automatic polling loop), use waitForDeviceAuthorization() instead.
 *
 * @see https://yoto.dev/api/post-oauth-token/
 * @param {object} options
 * @param {string} options.deviceCode - Device code from requestDeviceCode()
 * @param {string} options.clientId - OAuth client ID
 * @param {string} [options.audience='https://api.yotoplay.com'] - Audience for the token
 * @param {number} [options.currentInterval=5000] - Current polling interval in milliseconds
 * @param {string} [options.userAgent] - Optional user agent string
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 * @returns {Promise<YotoDevicePollResult>} Poll result with status and data
 * @throws {YotoAPIError} For unrecoverable errors (expired_token, access_denied, invalid_grant, etc)
 *
 */
export async function pollForDeviceToken ({
  deviceCode,
  clientId,
  audience = DEFAULT_AUDIENCE,
  currentInterval = 5000,
  userAgent,
  requestOptions
}) {
  try {
    const tokens = await exchangeToken({
      grantType: DEVICE_CODE_GRANT_TYPE,
      deviceCode,
      clientId,
      audience,
      userAgent,
      requestOptions
    })

    // Success - return tokens
    return {
      status: 'success',
      tokens
    }
  } catch (err) {
    const error = /** @type {any} */ (err)
    const errorCode = error.body?.error

    // Handle recoverable polling states
    if (errorCode === 'authorization_pending') {
      // User hasn't authorized yet - continue polling
      return {
        status: 'pending',
        interval: currentInterval
      }
    }

    if (errorCode === 'slow_down') {
      // Polling too fast - increase interval by 5 seconds
      return {
        status: 'slow_down',
        interval: currentInterval + 5000
      }
    }

    // All other errors are unrecoverable - throw them
    // Common unrecoverable errors:
    // - expired_token: Device code expired
    // - access_denied: User denied authorization
    // - invalid_grant: Invalid device code or other grant issue
    throw error
  }
}

/**
 * Wait for device authorization to complete with automatic polling.
 * This function wraps the entire polling loop - just call it and await the result.
 * It handles all polling logic internally including interval adjustments.
 *
 * Designed for CLI usage where you want to block until authorization completes.
 * For UI implementations with progress feedback, use pollForDeviceToken() directly.
 *
 * @see https://yoto.dev/api/post-oauth-token/
 * @param {object} options
 * @param {string} options.deviceCode - Device code from requestDeviceCode()
 * @param {string} options.clientId - OAuth client ID
 * @param {string} [options.audience='https://api.yotoplay.com'] - Audience for the token
 * @param {number} [options.initialInterval=5000] - Initial polling interval in milliseconds
 * @param {number} [options.expiresIn] - Seconds until device code expires (for timeout calculation)
 * @param {string} [options.userAgent] - Optional user agent string
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 * @param {(result: YotoDevicePollResult) => void} [options.onPoll] - Optional callback invoked after each poll attempt
 * @returns {Promise<YotoTokenResponse>} Token response on successful authorization
 * @throws {YotoAPIError} For unrecoverable errors (expired_token, access_denied, invalid_grant, etc)
 * @throws {Error} If device code expires (timeout)
 *
 * @example
 * // Simple usage - just wait for tokens
 * const deviceAuth = await requestDeviceCode({ clientId })
 * console.log(`Visit: ${deviceAuth.verification_uri_complete}`)
 *
 * const tokens = await waitForDeviceAuthorization({
 *   deviceCode: deviceAuth.device_code,
 *   clientId,
 *   initialInterval: deviceAuth.interval * 1000,
 *   expiresIn: deviceAuth.expires_in
 * })
 *
 * console.log('Got tokens:', tokens)
 *
 * @example
 * // With progress callback
 * const tokens = await waitForDeviceAuthorization({
 *   deviceCode: deviceAuth.device_code,
 *   clientId,
 *   onPoll: (result) => {
 *     if (result.status === 'pending') process.stdout.write('.')
 *     if (result.status === 'slow_down') console.log('\nSlowing down...')
 *   }
 * })
 */
export async function waitForDeviceAuthorization ({
  deviceCode,
  clientId,
  audience = DEFAULT_AUDIENCE,
  initialInterval = 5000,
  expiresIn,
  userAgent,
  requestOptions,
  onPoll
}) {
  let interval = initialInterval
  const startTime = Date.now()
  const expiresAt = expiresIn ? startTime + (expiresIn * 1000) : null

  while (true) {
    // Check if we've exceeded the expiration time
    if (expiresAt && Date.now() >= expiresAt) {
      throw new Error('Device code has expired')
    }

    const result = await pollForDeviceToken({
      deviceCode,
      clientId,
      audience,
      currentInterval: interval,
      userAgent,
      requestOptions
    })

    // Invoke callback if provided
    if (onPoll) {
      onPoll(result)
    }

    if (result.status === 'success') {
      return result.tokens
    }

    if (result.status === 'slow_down') {
      interval = result.interval
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval))
  }
}
