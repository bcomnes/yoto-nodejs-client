/**
 * @typedef {Object} RefreshableTokenOpts
 * @property {string} clientId - OAuth client ID
 * @property {string} refreshToken - OAuth refresh token
 * @property {string} accessToken - Initial OAuth access token (JWT)
 * @property {number} [bufferSeconds=30] - Seconds before expiration to consider token expired
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
 * - 'refresh:success' - Emitted when token refresh succeeds, passes { clientId, accessToken, refreshToken, expiresAt }
 * - 'refresh:error' - Emitted when token refresh fails (transient errors), passes error
 * - 'invalid' - Emitted when refresh token is permanently invalid, passes error
 *
 * @extends {EventEmitter<RefreshableTokenEventMap>}
 */
export class RefreshableToken extends EventEmitter<RefreshableTokenEventMap> {
    /**
     * @param {RefreshableTokenOpts} opts
     */
    constructor({ clientId, refreshToken, accessToken, bufferSeconds }: RefreshableTokenOpts);
    /**
     * Get a valid access token, refreshing if necessary.
     * @returns {Promise<string>} Valid access token
     * @throws {Error} If token is invalid or refresh fails
     */
    getAccessToken(): Promise<string>;
    /**
     * Check if the token is currently valid (not expired and not marked invalid).
     * @returns {boolean} True if token is valid
     */
    isValid(): boolean;
    /**
     * Get the expiration timestamp of the current access token.
     * @returns {number} Unix timestamp (seconds since epoch)
     */
    getExpiresAt(): number;
    /**
     * Get the time remaining until token expiration.
     * @returns {number} Seconds until expiration (may be negative if expired)
     */
    getTimeRemaining(): number;
    /**
     * Manually trigger a token refresh, regardless of expiration status.
     * Useful for proactive refresh or testing.
     * @returns {Promise<RefreshSuccessEvent>} Token information including clientId, accessToken, refreshToken, and expiresAt
     * @throws {Error} If token is invalid or refresh fails
     */
    refresh(): Promise<RefreshSuccessEvent>;
    #private;
}
export type RefreshableTokenOpts = {
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
     * - Seconds before expiration to consider token expired
     */
    bufferSeconds?: number;
};
export type RefreshSuccessEvent = {
    /**
     * - The OAuth client ID
     */
    clientId: string;
    /**
     * - The new access token
     */
    updatedAccessToken: string;
    /**
     * - The refresh token (may be updated)
     */
    updatedRefreshToken: string;
    /**
     * - Unix timestamp in seconds when token expires
     */
    updatedExpiresAt: number;
    /**
     * - The accessToken used in to initiate the refresh flow to be discarded
     */
    prevAccessToken: string;
    /**
     * - The refreshToken used in to initiate the refresh flow to be discarded
     */
    prevRefreshToken: string;
    /**
     * - The expiresAt for the previous token pair
     */
    prevExpiresAt: number;
};
/**
 * Event map for RefreshableToken
 */
export type RefreshableTokenEventMap = {
    "refresh:start": [];
    "refresh:success": [RefreshSuccessEvent];
    "refresh:error": [Error];
    "invalid": [Error];
};
import { EventEmitter } from 'node:events';
//# sourceMappingURL=token.d.ts.map