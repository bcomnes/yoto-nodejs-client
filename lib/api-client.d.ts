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
 * @property {string} [userAgent] - Optional user agent string to identify your application
 * @property {RequestOptions} [defaultRequestOptions] - Default undici request options for all requests (dispatcher, timeouts, etc.)
 */
/**
 * Yoto API Client with automatic token refresh
 */
export class YotoClient {
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
    static getAuthorizeUrl(params: {
        clientId: string;
        redirectUri: string;
        responseType: "code" | "token" | "id_token" | "code token" | "code id_token" | "token id_token" | "code token id_token";
        state: string;
        audience?: string | undefined;
        scope?: string | undefined;
        nonce?: string | undefined;
        prompt?: "none" | "login" | "consent" | "select_account" | undefined;
        maxAge?: number | undefined;
        codeChallenge?: string | undefined;
        codeChallengeMethod?: "S256" | "plain" | undefined;
    }): string;
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
    static exchangeToken(params: {
        grantType: "authorization_code" | "refresh_token" | "client_credentials" | "urn:ietf:params:oauth:grant-type:device_code";
        code?: string | undefined;
        redirectUri?: string | undefined;
        refreshToken?: string | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        scope?: string | undefined;
        codeVerifier?: string | undefined;
        deviceCode?: string | undefined;
        audience?: string | undefined;
    }): Promise<Auth.YotoTokenResponse>;
    /**
     * Request device code for device authorization flow
     * @see https://yoto.dev/api/post-oauth-device-code/
     * @param {object} params
     * @param {string} params.clientId - OAuth client ID
     * @param {string} [params.scope] - Requested scopes
     * @param {string} [params.audience] - Audience for the token
     * @returns {Promise<YotoDeviceCodeResponse>}
     */
    static requestDeviceCode(params: {
        clientId: string;
        scope?: string | undefined;
        audience?: string | undefined;
    }): Promise<Auth.YotoDeviceCodeResponse>;
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
    static pollForDeviceToken(params: {
        deviceCode: string;
        clientId: string;
        audience?: string | undefined;
        currentInterval?: number | undefined;
        userAgent?: string | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Auth.YotoDevicePollResult>;
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
    static waitForDeviceAuthorization(params: {
        deviceCode: string;
        clientId: string;
        audience?: string | undefined;
        initialInterval?: number | undefined;
        expiresIn?: number | undefined;
        userAgent?: string | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
        onPoll?: ((result: Auth.YotoDevicePollResult) => void) | undefined;
    }): Promise<Auth.YotoTokenResponse>;
    /**
     * Create a new Yoto API client
     * @param {YotoClientConstructorOptions} options
     */
    constructor({ clientId, refreshToken, accessToken, onTokenRefresh, bufferSeconds, onRefreshStart, onRefreshError, onInvalid, userAgent, defaultRequestOptions }: YotoClientConstructorOptions);
    /**
     * Get the underlying RefreshableToken instance
     * @returns {RefreshableToken}
     */
    get token(): RefreshableToken;
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
    getContent({ cardId, timezone, signingType, playable, requestOptions }: {
        cardId: string;
        timezone?: string | undefined;
        signingType?: "full" | "pre" | undefined;
        playable?: boolean | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Content.YotoContentResponse>;
    /**
     * Get user's MYO (Make Your Own) content
     * @see https://yoto.dev/api/getusersmyocontent/
     * @param {object} [params]
     * @param {boolean} [params.showDeleted=false] - Include deleted content
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoMyoContentResponse>}
     */
    getUserMyoContent({ showDeleted, requestOptions }?: {
        showDeleted?: boolean | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Content.YotoMyoContentResponse>;
    /**
     * Create or update content/card
     * @see https://yoto.dev/api/createorupdatecontent/
     * @param {object} params
     * @param {YotoCreateOrUpdateContentRequest} params.content - Content data to create/update
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoCreateOrUpdateContentResponse>}
     */
    createOrUpdateContent({ content, requestOptions }: {
        content: Content.YotoCreateOrUpdateContentRequest;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Content.YotoCreateOrUpdateContentResponse>;
    /**
     * Delete content/card
     * @see https://yoto.dev/api/deletecontent/
     * @param {object} params
     * @param {string} params.cardId - The card/content ID to delete
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoDeleteContentResponse>}
     */
    deleteContent({ cardId, requestOptions }: {
        cardId: string;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Content.YotoDeleteContentResponse>;
    /**
     * Get all devices for authenticated user
     * @see https://yoto.dev/api/getdevices/
     * @param {object} [params]
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoDevicesResponse>}
     */
    getDevices({ requestOptions }?: {
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoDevicesResponse>;
    /**
     * Get device status
     * @see https://yoto.dev/api/getdevicestatus/
     * @param {object} params
     * @param {string} params.deviceId - Device ID
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoDeviceStatusResponse>}
     */
    getDeviceStatus({ deviceId, requestOptions }: {
        deviceId: string;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoDeviceStatusResponse>;
    /**
     * Get device configuration
     * @see https://yoto.dev/api/getdeviceconfig/
     * @param {object} params
     * @param {string} params.deviceId - Device ID
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoDeviceConfigResponse>}
     */
    getDeviceConfig({ deviceId, requestOptions }: {
        deviceId: string;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoDeviceConfigResponse>;
    /**
     * Update device configuration
     * @see https://yoto.dev/api/updatedeviceconfig/
     * @param {object} params
     * @param {string} params.deviceId - Device ID
     * @param {YotoUpdateDeviceConfigRequest} params.configUpdate - Config updates
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoUpdateDeviceConfigResponse>}
     */
    updateDeviceConfig({ deviceId, configUpdate, requestOptions }: {
        deviceId: string;
        configUpdate: Devices.YotoUpdateDeviceConfigRequest;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoUpdateDeviceConfigResponse>;
    /**
     * Update device shortcuts
     * @see https://yoto.dev/api/updateshortcutsbeta/
     * @param {object} params
     * @param {string} params.deviceId - Device ID
     * @param {YotoUpdateShortcutsRequest} params.shortcutsUpdate - Shortcuts config
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoUpdateShortcutsResponse>}
     */
    updateDeviceShortcuts({ deviceId, shortcutsUpdate, requestOptions }: {
        deviceId: string;
        shortcutsUpdate: Devices.YotoUpdateShortcutsRequest;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoUpdateShortcutsResponse>;
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
    sendDeviceCommand({ deviceId, command, requestOptions }: {
        deviceId: string;
        command: Devices.YotoDeviceCommand;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Devices.YotoDeviceCommandResponse>;
    /**
     * Get all family library groups
     * @see https://yoto.dev/api/getgroups/
     * @param {object} [params]
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoGroup[]>}
     */
    getGroups({ requestOptions }?: {
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<FamilyLibraryGroups.YotoGroup[]>;
    /**
     * Create a family library group
     * @see https://yoto.dev/api/createagroup/
     * @param {object} params
     * @param {YotoCreateGroupRequest} params.group - Group data
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoGroup>}
     */
    createGroup({ group, requestOptions }: {
        group: FamilyLibraryGroups.YotoCreateGroupRequest;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<FamilyLibraryGroups.YotoGroup>;
    /**
     * Get a specific family library group
     * @see https://yoto.dev/api/getgroup/
     * @param {object} params
     * @param {string} params.groupId - Group ID
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoGroup>}
     */
    getGroup({ groupId, requestOptions }: {
        groupId: string;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<FamilyLibraryGroups.YotoGroup>;
    /**
     * Update a family library group
     * @see https://yoto.dev/api/updateagroup/
     * @param {object} params
     * @param {string} params.groupId - Group ID
     * @param {YotoUpdateGroupRequest} params.group - Updated group data
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoGroup>}
     */
    updateGroup({ groupId, group, requestOptions }: {
        groupId: string;
        group: FamilyLibraryGroups.YotoUpdateGroupRequest;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<FamilyLibraryGroups.YotoGroup>;
    /**
     * Delete a family library group
     * @see https://yoto.dev/api/deleteagroup/
     * @param {object} params
     * @param {string} params.groupId - Group ID
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoDeleteGroupResponse>}
     */
    deleteGroup({ groupId, requestOptions }: {
        groupId: string;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<FamilyLibraryGroups.YotoDeleteGroupResponse>;
    /**
     * Get all family images
     * @see https://yoto.dev/api/getfamilyimages/
     * @param {object} [params]
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoFamilyImagesResponse>}
     */
    getFamilyImages({ requestOptions }?: {
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Family.YotoFamilyImagesResponse>;
    /**
     * Get a specific family image
     * @see https://yoto.dev/api/getafamilyimage/
     * @param {object} params
     * @param {string} params.imageId - Image ID
     * @param {'640x480' | '320x320'} params.size - Image size
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoFamilyImageResponse>}
     */
    getAFamilyImage({ imageId, size, requestOptions }: {
        imageId: string;
        size: "640x480" | "320x320";
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Family.YotoFamilyImageResponse>;
    /**
     * Upload a family image
     * @see https://yoto.dev/api/uploadafamilyimage/
     * @param {object} params
     * @param {Buffer} params.imageData - Image binary data
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoUploadFamilyImageResponse>}
     */
    uploadAFamilyImage({ imageData, requestOptions }: {
        imageData: Buffer;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Family.YotoUploadFamilyImageResponse>;
    /**
     * Get public Yoto icons
     * @see https://yoto.dev/api/getpublicicons/
     * @param {object} [params]
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoPublicIconsResponse>}
     */
    getPublicIcons({ requestOptions }?: {
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Icons.YotoPublicIconsResponse>;
    /**
     * Get user's custom icons
     * @see https://yoto.dev/api/getusericons/
     * @param {object} [params]
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoUserIconsResponse>}
     */
    getUserIcons({ requestOptions }?: {
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Icons.YotoUserIconsResponse>;
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
    uploadIcon({ imageData, autoConvert, filename, requestOptions }: {
        imageData: Buffer;
        autoConvert?: boolean | undefined;
        filename?: string | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Icons.YotoUploadIconResponse>;
    /**
     * Get audio upload URL
     * @see https://yoto.dev/api/getaudiouploadurl/
     * @param {object} params
     * @param {string} params.sha256 - SHA256 hash of audio file
     * @param {string} [params.filename] - Optional filename
     * @param {RequestOptions} [params.requestOptions] - Request options that override defaults
     * @returns {Promise<YotoAudioUploadUrlResponse>}
     */
    getAudioUploadUrl({ sha256, filename, requestOptions }: {
        sha256: string;
        filename?: string | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Media.YotoAudioUploadUrlResponse>;
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
    uploadCoverImage({ imageData, imageUrl, autoConvert, coverType, filename, requestOptions }: {
        imageData?: Buffer<ArrayBufferLike> | undefined;
        imageUrl?: string | undefined;
        autoConvert?: boolean | undefined;
        coverType?: Media.YotoCoverType | undefined;
        filename?: string | undefined;
        requestOptions?: ({
            dispatcher?: import("undici").Dispatcher;
        } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    }): Promise<Media.YotoUploadCoverImageResponse>;
    /**
     * Create an MQTT client for a device
     * @param {Object} params
     * @param {string} params.deviceId - Device ID to connect to
     * @param {MqttClientOptions} [params.mqttOptions] - MQTT.js client options (excluding deviceId and accessToken which are provided automatically)
     * @returns {Promise<YotoMqttClient>}
     */
    createMqttClient({ deviceId, mqttOptions }: {
        deviceId: string;
        mqttOptions?: Partial<import("mqtt").IClientOptions> | undefined;
    }): Promise<YotoMqttClient>;
    #private;
}
export type YotoClientConstructorOptions = {
    /**
     * - OAuth client ID
     */
    clientId: string;
    /**
     * - OAuth refresh token
     */
    refreshToken: string;
    /**
     * - Initial OAuth access token (JWT)
     */
    accessToken: string;
    /**
     * - **REQUIRED** Callback invoked when tokens are refreshed. You MUST persist these tokens (to file, database, etc.) as the refresh can happen at any time during API calls. The refresh token may be rotated by the auth server. **DO NOT STUB THIS CALLBACK** - always implement proper persistence logic.
     */
    onTokenRefresh: (refreshedTokenData: RefreshSuccessEvent) => void | Promise<void>;
    /**
     * - Seconds before expiration to consider token expired
     */
    bufferSeconds?: number;
    /**
     * - Optional callback invoked when token refresh starts. Defaults to console.log.
     */
    onRefreshStart?: () => void | Promise<void>;
    /**
     * - Optional callback invoked when token refresh fails with a transient error. Defaults to console.warn.
     */
    onRefreshError?: (error: Error) => void | Promise<void>;
    /**
     * - Optional callback invoked when refresh token is permanently invalid. Defaults to console.error.
     */
    onInvalid?: (error: Error) => void | Promise<void>;
    /**
     * - Optional user agent string to identify your application
     */
    userAgent?: string;
    /**
     * - Default undici request options for all requests (dispatcher, timeouts, etc.)
     */
    defaultRequestOptions?: RequestOptions;
};
import { RefreshableToken } from './token.js';
import * as Content from './api-endpoints/content.js';
import * as Devices from './api-endpoints/devices.js';
import * as FamilyLibraryGroups from './api-endpoints/family-library-groups.js';
import * as Family from './api-endpoints/family.js';
import * as Icons from './api-endpoints/icons.js';
import * as Media from './api-endpoints/media.js';
import type { YotoMqttClient } from './mqtt/client.js';
import * as Auth from './api-endpoints/auth.js';
import type { RefreshSuccessEvent } from './token.js';
import type { RequestOptions } from './api-endpoints/helpers.js';
//# sourceMappingURL=api-client.d.ts.map