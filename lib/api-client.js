/**
 * @import { YotoContentResponse, YotoCreateOrUpdateContentRequest, YotoMyoContentResponse, YotoCreateOrUpdateContentResponse, YotoDeleteContentResponse } from './api-endpoints/content.js'
 * @import { YotoDevicesResponse, YotoDeviceStatusResponse, YotoDeviceConfigResponse, YotoUpdateDeviceConfigRequest, YotoUpdateDeviceConfigResponse, YotoUpdateShortcutsRequest, YotoUpdateShortcutsResponse, YotoDeviceCommand, YotoDeviceCommandResponse } from './api-endpoints/devices.js'
 * @import { YotoGroup, YotoCreateGroupRequest, YotoUpdateGroupRequest, YotoDeleteGroupResponse } from './api-endpoints/family-library-groups.js'
 * @import { YotoFamilyImagesResponse, YotoFamilyImageResponse, YotoUploadFamilyImageResponse } from './api-endpoints/family.js'
 * @import { YotoPublicIconsResponse, YotoUserIconsResponse, YotoUploadIconResponse } from './api-endpoints/icons.js'
 * @import { YotoAudioUploadUrlResponse, YotoUploadCoverImageResponse, YotoCoverType } from './api-endpoints/media.js'
 * @import { YotoTokenResponse, YotoDeviceCodeResponse, YotoDevicePollResult } from './api-endpoints/auth.js'
 * @import { YotoMqttClient } from './mqtt/client.js'
 * @import { MqttClientOptions, YotoMqttOptions } from './mqtt/factory.js'
 * @import { RequestOptions } from './api-endpoints/helpers.js'
 * @import { RefreshSuccessEvent } from './token.js'
 */

import { RefreshableToken } from './token.js'
import { randomUUID } from 'node:crypto'
import * as Auth from './api-endpoints/auth.js'
import * as Content from './api-endpoints/content.js'
import * as Devices from './api-endpoints/devices.js'
import * as FamilyLibraryGroups from './api-endpoints/family-library-groups.js'
import * as Family from './api-endpoints/family.js'
import * as Icons from './api-endpoints/icons.js'
import * as Media from './api-endpoints/media.js'
import { createYotoMqttClient } from './mqtt/index.js'

/**
 * @typedef {Object} YotoClientConstructorOptions
 * @property {string} clientId - OAuth client ID
 * @property {string} refreshToken - OAuth refresh token
 * @property {string} accessToken - Initial OAuth access token (JWT)
 * @property {(refreshedTokenData: RefreshSuccessEvent) => void | Promise<void>} onTokenRefresh - **REQUIRED** Callback invoked when tokens are refreshed. You MUST persist these tokens (to file, database, etc.) as the refresh can happen at any time during API calls. The refresh token may be rotated by the auth server. **DO NOT STUB THIS CALLBACK** - always implement proper persistence logic.
 * @property {number} [bufferSeconds=30] - Seconds before expiration to consider token expired
 * @property {() => void | Promise<void>} [onRefreshStart] - Optional callback invoked when token refresh starts. Defaults to console.log.
 * @property {(error: Error) => void | Promise<void>} [onRefreshError] - Optional callback invoked when token refresh fails with a transient error. Defaults to console.warn.
 * @property {(error: Error) => void | Promise<void>} [onInvalid] - Optional callback invoked when refresh token is permanently invalid. Defaults to console.error.
 * @property {string} [mqttClientId] - Stable unique client ID suffix used for MQTT connections (defaults to a random UUID per YotoClient instance)
 * @property {string} [userAgent] - Optional user agent string to identify your application
 * @property {RequestOptions} [defaultRequestOptions] - Default undici request options for all requests (dispatcher, timeouts, etc.)
 */

/**
 * Yoto API Client with automatic token refresh
 */
export class YotoClient {
  // ============================================================================
  // Authentication Static Methods
  // ============================================================================

  /**
   * Get authorization URL for browser-based OAuth flow
   * @see https://yoto.dev/api/get-authorize/
   * @param {object} params
   * @param {string} params.clientId - OAuth client ID
   * @param {string} params.redirectUri - Redirect URI after authorization
   * @param {'code' | 'token' | 'id_token' | 'code token' | 'code id_token' | 'token id_token' | 'code token id_token'} params.responseType - OAuth response type
   * @param {string} params.state - State parameter for CSRF protection
   * @param {string} [params.audience] - Audience for the token
   * @param {string} [params.scope] - Requested scopes
   * @param {string} [params.nonce] - Nonce for replay attack prevention
   * @param {'none' | 'login' | 'consent' | 'select_account'} [params.prompt] - Authorization prompt behavior
   * @param {number} [params.maxAge] - Maximum authentication age in seconds
   * @param {string} [params.codeChallenge] - PKCE code challenge
   * @param {'S256' | 'plain'} [params.codeChallengeMethod] - PKCE code challenge method
   * @returns {string} Authorization URL
   */
  static getAuthorizeUrl (params) {
    return Auth.getAuthorizeUrl(params)
  }

  /**
   * Exchange authorization code or refresh token for access tokens
   * @see https://yoto.dev/api/post-oauth-token/
   * @param {object} params
   * @param {'authorization_code' | 'refresh_token' | 'client_credentials' | 'urn:ietf:params:oauth:grant-type:device_code'} params.grantType - OAuth grant type
   * @param {string} [params.code] - Authorization code (required for authorization_code grant)
   * @param {string} [params.redirectUri] - Redirect URI (required for authorization_code grant if used in authorize request)
   * @param {string} [params.refreshToken] - Refresh token (required for refresh_token grant)
   * @param {string} [params.clientId] - OAuth client ID
   * @param {string} [params.clientSecret] - OAuth client secret
   * @param {string} [params.scope] - Requested scope
   * @param {string} [params.codeVerifier] - PKCE code verifier
   * @param {string} [params.deviceCode] - Device code (required for device_code grant)
   * @param {string} [params.audience] - Audience for the token
   * @returns {Promise<YotoTokenResponse>}
   */
  static async exchangeToken (params) {
    return await Auth.exchangeToken(params)
  }

  /**
   * Request device code for device authorization flow
   * @see https://yoto.dev/api/post-oauth-device-code/
   * @param {object} params
   * @param {string} params.clientId - OAuth client ID
   * @param {string} [params.scope] - Requested scopes
   * @param {string} [params.audience] - Audience for the token
   * @returns {Promise<YotoDeviceCodeResponse>}
   */
  static async requestDeviceCode (params) {
    return await Auth.requestDeviceCode(params)
  }

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
   * @param {object} params
   * @param {string} params.deviceCode - Device code from requestDeviceCode()
   * @param {string} params.clientId - OAuth client ID
   * @param {string} [params.audience] - Audience for the token
   * @param {number} [params.currentInterval=5000] - Current polling interval in milliseconds
   * @param {string} [params.userAgent] - Optional user agent string
   * @param {RequestOptions} [params.requestOptions] - Additional undici request options
   * @returns {Promise<YotoDevicePollResult>} Poll result with status and data
   * @throws {YotoAPIError} For unrecoverable errors (expired_token, access_denied, invalid_grant, etc)
   */
  static async pollForDeviceToken (params) {
    return await Auth.pollForDeviceToken(params)
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
   * @param {object} params
   * @param {string} params.deviceCode - Device code from requestDeviceCode()
   * @param {string} params.clientId - OAuth client ID
   * @param {string} [params.audience] - Audience for the token
   * @param {number} [params.initialInterval=5000] - Initial polling interval in milliseconds
   * @param {number} [params.expiresIn] - Seconds until device code expires (for timeout calculation)
   * @param {string} [params.userAgent] - Optional user agent string
   * @param {RequestOptions} [params.requestOptions] - Additional undici request options
   * @param {(result: YotoDevicePollResult) => void} [params.onPoll] - Optional callback invoked after each poll attempt
   * @returns {Promise<YotoTokenResponse>} Token response on successful authorization
   * @throws {YotoAPIError} For unrecoverable errors (expired_token, access_denied, invalid_grant, etc)
   * @throws {Error} If device code expires (timeout)
   */
  static async waitForDeviceAuthorization (params) {
    return await Auth.waitForDeviceAuthorization(params)
  }

  // ============================================================================
  // Instance Properties and Constructor
  // ============================================================================
  /** @type {RefreshableToken} */
  #token

  /** @type {string} */
  #mqttClientId

  /** @type {string | undefined} */
  #userAgent

  /** @type {RequestOptions | undefined} */
  #defaultRequestOptions

  /**
   * Create a new Yoto API client
   * @param {YotoClientConstructorOptions} options
   */
  constructor ({
    clientId,
    refreshToken,
    accessToken,
    onTokenRefresh,
    bufferSeconds,
    onRefreshStart,
    onRefreshError,
    onInvalid,
    mqttClientId,
    userAgent,
    defaultRequestOptions
  }) {
    if (!onTokenRefresh) {
      throw new Error('onTokenRefresh callback is required. You must persist refreshed tokens as they can be updated at any time.')
    }

    this.#token = new RefreshableToken({
      clientId,
      refreshToken,
      accessToken,
      ...(bufferSeconds !== undefined && { bufferSeconds })
    })

    this.#mqttClientId = mqttClientId || randomUUID()

    this.#userAgent = userAgent
    this.#defaultRequestOptions = defaultRequestOptions

    // Listen for token refresh events and call the user's callbacks
    this.#token.on('refresh:success', onTokenRefresh)

    this.#token.on('refresh:start', onRefreshStart || (() => {
      console.log('Token refresh started')
    }))

    this.#token.on('refresh:error', onRefreshError || ((error) => {
      console.warn('Token refresh failed (transient error):', error.message)
    }))

    this.#token.on('invalid', onInvalid || ((error) => {
      console.error('Refresh token is permanently invalid:', error.message)
    }))
  }

  /**
   * Get the underlying RefreshableToken instance
   * @returns {RefreshableToken}
   */
  get token () {
    return this.#token
  }

  /**
   * Get the stable unique MQTT client ID suffix used by this client instance.
   * @returns {string}
   */
  get mqttClientId () {
    return this.#mqttClientId
  }
  // ============================================================================
  // Content API
  // ============================================================================

  /**
   * Get content/card details
   * @see https://yoto.dev/api/getcontent/
   * @param {object} params
   * @param {string} params.cardId - The card/content ID
   * @param {string} [params.timezone] - Timezone for schedule-based content
   * @param {'full' | 'pre'} [params.signingType] - Type of URL signing
   * @param {boolean} [params.playable] - Whether to include playback URLs
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoContentResponse>}
   */
  async getContent ({ cardId, timezone, signingType, playable, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Content.getContent({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      cardId,
      timezone,
      signingType,
      playable
    })
  }

  /**
   * Get user's MYO (Make Your Own) content
   * @see https://yoto.dev/api/getusersmyocontent/
   * @param {object} [params]
   * @param {boolean} [params.showDeleted=false] - Include deleted content
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoMyoContentResponse>}
   */
  async getUserMyoContent ({ showDeleted = false, requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await Content.getUserMyoContent({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      showDeleted
    })
  }

  /**
   * Create or update content/card
   * @see https://yoto.dev/api/createorupdatecontent/
   * @param {object} params
   * @param {YotoCreateOrUpdateContentRequest} params.content - Content data to create/update
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoCreateOrUpdateContentResponse>}
   */
  async createOrUpdateContent ({ content, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Content.createOrUpdateContent({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      content
    })
  }

  /**
   * Delete content/card
   * @see https://yoto.dev/api/deletecontent/
   * @param {object} params
   * @param {string} params.cardId - The card/content ID to delete
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDeleteContentResponse>}
   */
  async deleteContent ({ cardId, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Content.deleteContent({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      cardId
    })
  }

  // ============================================================================
  // Devices API
  // ============================================================================

  /**
   * Get all devices for authenticated user
   * @see https://yoto.dev/api/getdevices/
   * @param {object} [params]
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDevicesResponse>}
   */
  async getDevices ({ requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.getDevices({ accessToken, userAgent: this.#userAgent, requestOptions: requestOptions || this.#defaultRequestOptions })
  }

  /**
   * Get device status
   * @see https://yoto.dev/api/getdevicestatus/
   * @param {object} params
   * @param {string} params.deviceId - Device ID
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDeviceStatusResponse>}
   */
  async getDeviceStatus ({ deviceId, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.getDeviceStatus({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      deviceId
    })
  }

  /**
   * Get device configuration
   * @see https://yoto.dev/api/getdeviceconfig/
   * @param {object} params
   * @param {string} params.deviceId - Device ID
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDeviceConfigResponse>}
   */
  async getDeviceConfig ({ deviceId, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.getDeviceConfig({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      deviceId
    })
  }

  /**
   * Update device configuration
   * @see https://yoto.dev/api/updatedeviceconfig/
   * @param {object} params
   * @param {string} params.deviceId - Device ID
   * @param {YotoUpdateDeviceConfigRequest} params.configUpdate - Config updates
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUpdateDeviceConfigResponse>}
   */
  async updateDeviceConfig ({ deviceId, configUpdate, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.updateDeviceConfig({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      deviceId,
      configUpdate
    })
  }

  /**
   * Update device shortcuts
   * @see https://yoto.dev/api/updateshortcutsbeta/
   * @param {object} params
   * @param {string} params.deviceId - Device ID
   * @param {YotoUpdateShortcutsRequest} params.shortcutsUpdate - Shortcuts config
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUpdateShortcutsResponse>}
   */
  async updateDeviceShortcuts ({ deviceId, shortcutsUpdate, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.updateDeviceShortcuts({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      deviceId,
      shortcutsUpdate
    })
  }

  /**
   * Send command to device
   * @see https://yoto.dev/api/senddevicecommand/
   * @see https://yoto.dev/players-mqtt/mqtt-docs/
   * @param {object} params
   * @param {string} params.deviceId - Device ID
   * @param {YotoDeviceCommand} params.command - Command to send
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDeviceCommandResponse>}
   */
  async sendDeviceCommand ({ deviceId, command, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Devices.sendDeviceCommand({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      deviceId,
      command
    })
  }

  // ============================================================================
  // Family Library Groups API
  // ============================================================================

  /**
   * Get all family library groups
   * @see https://yoto.dev/api/getgroups/
   * @param {object} [params]
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoGroup[]>}
   */
  async getGroups ({ requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await FamilyLibraryGroups.getGroups({ accessToken, userAgent: this.#userAgent, requestOptions: requestOptions || this.#defaultRequestOptions })
  }

  /**
   * Create a family library group
   * @see https://yoto.dev/api/createagroup/
   * @param {object} params
   * @param {YotoCreateGroupRequest} params.group - Group data
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoGroup>}
   */
  async createGroup ({ group, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await FamilyLibraryGroups.createGroup({
      token: accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      group
    })
  }

  /**
   * Get a specific family library group
   * @see https://yoto.dev/api/getgroup/
   * @param {object} params
   * @param {string} params.groupId - Group ID
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoGroup>}
   */
  async getGroup ({ groupId, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await FamilyLibraryGroups.getGroup({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      groupId
    })
  }

  /**
   * Update a family library group
   * @see https://yoto.dev/api/updateagroup/
   * @param {object} params
   * @param {string} params.groupId - Group ID
   * @param {YotoUpdateGroupRequest} params.group - Updated group data
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoGroup>}
   */
  async updateGroup ({ groupId, group, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await FamilyLibraryGroups.updateGroup({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      groupId,
      group
    })
  }

  /**
   * Delete a family library group
   * @see https://yoto.dev/api/deleteagroup/
   * @param {object} params
   * @param {string} params.groupId - Group ID
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoDeleteGroupResponse>}
   */
  async deleteGroup ({ groupId, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await FamilyLibraryGroups.deleteGroup({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      groupId
    })
  }

  // ============================================================================
  // Family Images API
  // ============================================================================

  /**
   * Get all family images
   * @see https://yoto.dev/api/getfamilyimages/
   * @param {object} [params]
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoFamilyImagesResponse>}
   */
  async getFamilyImages ({ requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await Family.getFamilyImages({ accessToken, userAgent: this.#userAgent, requestOptions: requestOptions || this.#defaultRequestOptions })
  }

  /**
   * Get a specific family image
   * @see https://yoto.dev/api/getafamilyimage/
   * @param {object} params
   * @param {string} params.imageId - Image ID
   * @param {'640x480' | '320x320'} params.size - Image size
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoFamilyImageResponse>}
   */
  async getAFamilyImage ({ imageId, size, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Family.getAFamilyImage({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      imageId,
      size
    })
  }

  /**
   * Upload a family image
   * @see https://yoto.dev/api/uploadafamilyimage/
   * @param {object} params
   * @param {Buffer} params.imageData - Image binary data
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUploadFamilyImageResponse>}
   */
  async uploadAFamilyImage ({ imageData, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Family.uploadAFamilyImage({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      imageData
    })
  }

  // ============================================================================
  // Icons API
  // ============================================================================

  /**
   * Get public Yoto icons
   * @see https://yoto.dev/api/getpublicicons/
   * @param {object} [params]
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoPublicIconsResponse>}
   */
  async getPublicIcons ({ requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await Icons.getPublicIcons({ accessToken, userAgent: this.#userAgent, requestOptions: requestOptions || this.#defaultRequestOptions })
  }

  /**
   * Get user's custom icons
   * @see https://yoto.dev/api/getusericons/
   * @param {object} [params]
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUserIconsResponse>}
   */
  async getUserIcons ({ requestOptions } = {}) {
    const accessToken = await this.#token.getAccessToken()
    return await Icons.getUserIcons({ accessToken, userAgent: this.#userAgent, requestOptions: requestOptions || this.#defaultRequestOptions })
  }

  /**
   * Upload a custom icon
   * @see https://yoto.dev/api/uploadicon/
   * @param {object} params
   * @param {Buffer} params.imageData - Image binary data
   * @param {boolean} [params.autoConvert=true] - Auto-convert to proper format
   * @param {string} [params.filename] - Optional filename
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUploadIconResponse>}
   */
  async uploadIcon ({ imageData, autoConvert = true, filename, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Icons.uploadIcon({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      imageData,
      autoConvert,
      filename
    })
  }

  // ============================================================================
  // Media API
  // ============================================================================

  /**
   * Get audio upload URL
   * @see https://yoto.dev/api/getaudiouploadurl/
   * @param {object} params
   * @param {string} params.sha256 - SHA256 hash of audio file
   * @param {string} [params.filename] - Optional filename
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoAudioUploadUrlResponse>}
   */
  async getAudioUploadUrl ({ sha256, filename, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Media.getAudioUploadUrl({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      sha256,
      filename
    })
  }

  /**
   * Upload a cover image
   * @see https://yoto.dev/api/uploadcoverimage/
   * @param {object} params
   * @param {Buffer} [params.imageData] - Image binary data
   * @param {string} [params.imageUrl] - URL to image
   * @param {boolean} [params.autoConvert] - Auto-convert to proper format
   * @param {YotoCoverType} [params.coverType] - Cover image type
   * @param {string} [params.filename] - Optional filename
   * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
   * @returns {Promise<YotoUploadCoverImageResponse>}
   */
  async uploadCoverImage ({ imageData, imageUrl, autoConvert, coverType, filename, requestOptions }) {
    const accessToken = await this.#token.getAccessToken()
    return await Media.uploadCoverImage({
      accessToken,
      userAgent: this.#userAgent,
      requestOptions: requestOptions || this.#defaultRequestOptions,
      imageData,
      imageUrl,
      autoConvert,
      coverType,
      filename
    })
  }

  // ============================================================================
  // MQTT Client
  // ============================================================================

  /**
   * Create an MQTT client for a device
   * @param {Object} params
   * @param {string} params.deviceId - Device ID to connect to
   * @param {MqttClientOptions} [params.mqttOptions] - MQTT.js client options (excluding deviceId, token, and clientId which are provided automatically)
   * @returns {Promise<YotoMqttClient>}
   */
  async createMqttClient ({ deviceId, mqttOptions }) {
    await this.#token.getAccessToken()

    /** @type {YotoMqttOptions} */
    const opts = {
      deviceId,
      token: this.#token,
      sessionId: this.#mqttClientId,
      ...(mqttOptions && { mqttOptions })
    }

    return createYotoMqttClient(opts)
  }
}
