/**
 * Get common CLI option definitions shared across all tools
 * @returns {ArgscloptsParseArgsOptionsConfig}
 */
export function getCommonOptions(): ArgscloptsParseArgsOptionsConfig;
/**
 * Load .env file from specified path or default to .env in cwd
 * @param {string} [envFile] - Optional path to .env file
 * @returns {string} The path that was loaded (or attempted)
 */
export function loadEnvFile(envFile?: string): string;
/**
 * Load and validate tokens from environment
 * @param {{ values: Record<string, string | boolean | undefined> }} args - Parsed arguments from parseArgs
 * @returns {{ clientId: string, refreshToken: string, accessToken: string, envFile: string }}
 * @throws Exits process if tokens are missing
 */
export function loadTokensFromEnv(args: {
    values: Record<string, string | boolean | undefined>;
}): {
    clientId: string;
    refreshToken: string;
    accessToken: string;
    envFile: string;
};
/**
 * Create YotoClient with standard token persistence callbacks
 * @param {object} options
 * @param {string} options.clientId - OAuth client ID
 * @param {string} options.refreshToken - OAuth refresh token
 * @param {string} options.accessToken - OAuth access token
 * @param {string} [options.outputFile='.env'] - File to save refreshed tokens to
 * @returns {YotoClient}
 */
export function createYotoClient({ clientId, refreshToken, accessToken, outputFile }: {
    clientId: string;
    refreshToken: string;
    accessToken: string;
    outputFile?: string | undefined;
}): YotoClient;
/**
 * Standard error handler for CLI tools
 * @param {any} error
 */
export function handleCliError(error: any): void;
/**
 * Print CLI tool header with title
 * @param {string} title - The title to display
 */
export function printHeader(title: string): void;
import type { ArgscloptsParseArgsOptionsConfig } from 'argsclopts';
import { YotoClient } from '../../lib/api-client.js';
//# sourceMappingURL=cli-helpers.d.ts.map