/**
 * Format timestamp
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp: number): string;
/**
 * Check if token is expired
 * @param {number} exp
 * @param {number} bufferSeconds
 * @returns {{expired: boolean, message: string}}
 */
export function checkExpiration(exp: number, bufferSeconds?: number): {
    expired: boolean;
    message: string;
};
/**
 * Check if a JWT token is expired or about to expire
 * @param {string} token - JWT token to check
 * @param {number} bufferSeconds - Seconds before expiration to consider expired
 * @returns {{expired: boolean, message: string}}
 */
export function checkTokenExpiration(token: string, bufferSeconds?: number): {
    expired: boolean;
    message: string;
};
/**
 * Decode a JWT token without verification
 * @param {string} token
 * @returns {any}
 */
export function decodeJwt(token: string): any;
/**
 * Save tokens to .env file
 * @param {string} filename
 * @param {YotoTokenResponse} tokens
 * @param {string} clientId
 */
export function saveTokensToEnv(filename: string, tokens: YotoTokenResponse, clientId: string): Promise<void>;
/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms
 */
export function sleep(ms: number): Promise<any>;
import type { YotoTokenResponse } from '../../lib/api-endpoints/auth.js';
//# sourceMappingURL=token-helpers.d.ts.map