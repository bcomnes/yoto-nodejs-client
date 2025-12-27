/**
 * Load tokens from .env file for testing
 * @returns {{accessToken: string, refreshToken: string, clientId: string}}
 */
export function loadTestTokens(): {
    accessToken: string;
    refreshToken: string;
    clientId: string;
};
/**
 * Log API response for type verification and documentation.
 *
 * This is a first-class testing feature, not temporary debug code.
 * It helps with:
 * - Writing new tests by showing actual API response structure
 * - Verifying type definitions match reality
 * - Debugging test failures
 * - Documenting API behavior
 *
 * @param {string} label - Descriptive label for the response (e.g., 'GET DEVICES')
 * @param {any} response - The API response object to log
 *
 * @example
 * const devices = await getDevices({ token })
 * logResponse('GET DEVICES', devices)
 */
export function logResponse(label: string, response: any): void;
//# sourceMappingURL=endpoint-test-helpers.d.ts.map