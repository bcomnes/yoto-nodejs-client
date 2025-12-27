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
export function getAuthorizeUrl({ audience, scope, responseType, clientId, redirectUri, state, nonce, prompt, maxAge, codeChallenge, codeChallengeMethod }: {
    audience?: string | undefined;
    scope?: string | undefined;
    responseType: YotoOAuthResponseType;
    clientId: string;
    redirectUri: string;
    state: string;
    nonce?: string | undefined;
    prompt?: YotoOAuthPromptType | undefined;
    maxAge?: number | undefined;
    codeChallenge?: string | undefined;
    codeChallengeMethod?: YotoOAuthCodeChallengeMethod | undefined;
}): string;
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
export function exchangeToken({ grantType, code, redirectUri, refreshToken, clientId, clientSecret, scope, codeVerifier, deviceCode, audience, userAgent, requestOptions }: {
    grantType: YotoOAuthGrantType;
    code?: string | undefined;
    redirectUri?: string | undefined;
    refreshToken?: string | undefined;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    scope?: string | undefined;
    codeVerifier?: string | undefined;
    deviceCode?: string | undefined;
    audience?: string | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoTokenResponse>;
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
export function requestDeviceCode({ clientId, scope, audience, userAgent, requestOptions }: {
    clientId: string;
    scope?: string | undefined;
    audience?: string | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDeviceCodeResponse>;
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
export function pollForDeviceToken({ deviceCode, clientId, audience, currentInterval, userAgent, requestOptions }: {
    deviceCode: string;
    clientId: string;
    audience?: string | undefined;
    currentInterval?: number | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDevicePollResult>;
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
export function waitForDeviceAuthorization({ deviceCode, clientId, audience, initialInterval, expiresIn, userAgent, requestOptions, onPoll }: {
    deviceCode: string;
    clientId: string;
    audience?: string | undefined;
    initialInterval?: number | undefined;
    expiresIn?: number | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
    onPoll?: ((result: YotoDevicePollResult) => void) | undefined;
}): Promise<YotoTokenResponse>;
/**
 * OAuth2 response type for authorization requests
 */
export type YotoOAuthResponseType = "code" | "token" | "id_token" | "code token" | "code id_token" | "token id_token" | "code token id_token";
/**
 * OAuth2 prompt parameter for authorization requests
 */
export type YotoOAuthPromptType = "none" | "login" | "consent" | "select_account";
/**
 * PKCE code challenge method for authorization requests
 */
export type YotoOAuthCodeChallengeMethod = "S256" | "plain";
/**
 * OAuth2 grant type for token exchange requests
 */
export type YotoOAuthGrantType = "authorization_code" | "refresh_token" | "client_credentials" | typeof DEVICE_CODE_GRANT_TYPE;
export type YotoTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
    expires_at?: number;
};
export type YotoDeviceCodeResponse = {
    /**
     * - The device verification code
     */
    device_code: string;
    /**
     * - The code displayed to the user
     */
    user_code: string;
    /**
     * - The URL where the user should enter the user_code
     */
    verification_uri: string;
    /**
     * - The verification URL with the code included
     */
    verification_uri_complete?: string;
    /**
     * - The lifetime of the device code in seconds
     */
    expires_in: number;
    /**
     * - Minimum polling interval in seconds
     */
    interval: number;
};
/**
 * Poll result when authorization is still pending
 */
export type YotoDevicePollPending = {
    /**
     * - Indicates polling should continue
     */
    status: "pending";
    /**
     * - Current polling interval in milliseconds
     */
    interval: number;
};
/**
 * Poll result when polling needs to slow down
 */
export type YotoDevicePollSlowDown = {
    /**
     * - Indicates polling interval should be increased
     */
    status: "slow_down";
    /**
     * - New polling interval in milliseconds
     */
    interval: number;
};
/**
 * Poll result when authorization is successful
 */
export type YotoDevicePollSuccess = {
    /**
     * - Indicates successful authorization
     */
    status: "success";
    /**
     * - OAuth tokens
     */
    tokens: YotoTokenResponse;
};
/**
 * Poll result for device authorization flow
 */
export type YotoDevicePollResult = YotoDevicePollPending | YotoDevicePollSlowDown | YotoDevicePollSuccess;
import { DEVICE_CODE_GRANT_TYPE } from './constants.js';
//# sourceMappingURL=auth.d.ts.map