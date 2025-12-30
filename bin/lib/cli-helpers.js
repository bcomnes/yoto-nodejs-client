/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

import { YotoClient } from '../../lib/api-client.js'
import { DEFAULT_CLIENT_ID } from '../../lib/api-endpoints/constants.js'
import { saveTokensToEnv } from './token-helpers.js'

/**
 * Get common CLI option definitions shared across all tools
 * @returns {ArgscloptsParseArgsOptionsConfig}
 */
export function getCommonOptions () {
  return {
    help: {
      type: 'boolean',
      short: 'h',
      help: 'Print help text'
    },
    'client-id': {
      type: 'string',
      short: 'c',
      help: 'Yoto OAuth client ID (or set YOTO_CLIENT_ID env var)'
    },
    'env-file': {
      type: 'string',
      short: 'e',
      help: 'Path to .env file to load (default: .env in current directory)'
    }
  }
}

/**
 * Load .env file from specified path or default to .env in cwd
 * @param {string} [envFile] - Optional path to .env file
 * @returns {string} The path that was loaded (or attempted)
 */
export function loadEnvFile (envFile) {
  const envPath = envFile || '.env'
  try {
    process.loadEnvFile(envPath)
  } catch (_err) {
    // File doesn't exist or can't be loaded, that's okay
  }
  return envPath
}

/**
 * Load and validate tokens from environment
 * @param {{ values: Record<string, string | boolean | undefined> }} args - Parsed arguments from parseArgs
 * @returns {{ clientId: string, refreshToken: string, accessToken: string, envFile: string }}
 * @throws Exits process if tokens are missing
 */
export function loadTokensFromEnv (args) {
  const envFile = loadEnvFile(args.values['env-file'] ? String(args.values['env-file']) : undefined)

  const clientId = String(args.values['client-id'] || process.env['YOTO_CLIENT_ID'] || DEFAULT_CLIENT_ID)
  const refreshToken = String(process.env['YOTO_REFRESH_TOKEN'] || '')
  const accessToken = String(process.env['YOTO_ACCESS_TOKEN'] || '')

  if (!accessToken || !refreshToken) {
    console.error('❌ Both access token and refresh token are required')
    console.error('Provide tokens via:')
    console.error('  - Environment variables: YOTO_ACCESS_TOKEN and YOTO_REFRESH_TOKEN')
    console.error('  - .env file (default or specify with --env-file)')
    console.error('\n💡 Tip: Run yoto-auth to get both tokens')
    process.exit(1)
  }

  return { clientId, refreshToken, accessToken, envFile }
}

/**
 * Create YotoClient with standard token persistence callbacks
 * @param {object} options
 * @param {string} options.clientId - OAuth client ID
 * @param {string} options.refreshToken - OAuth refresh token
 * @param {string} options.accessToken - OAuth access token
 * @param {string} [options.outputFile='.env'] - File to save refreshed tokens to
 * @returns {YotoClient}
 */
export function createYotoClient ({ clientId, refreshToken, accessToken, outputFile = '.env' }) {
  return new YotoClient({
    clientId,
    refreshToken,
    accessToken,
    onTokenRefresh: async (tokens) => {
      // Save tokens if they refresh during operation
      const { resolvedPath } = await saveTokensToEnv(outputFile, {
        access_token: tokens.updatedAccessToken,
        refresh_token: tokens.updatedRefreshToken,
        token_type: 'Bearer',
        expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
      }, tokens.clientId)

      console.log(`Auth token refreshed: ${resolvedPath}`)
    },
    onRefreshStart: () => {
      console.log('\n🔄 Token refresh triggered...')
    },
    onRefreshError: () => {},
    onInvalid: () => {}
  })
}

/**
 * Standard error handler for CLI tools
 * @param {any} error
 */
export function handleCliError (error) {
  console.error('\n❌ Error:')
  console.error(`Message: ${error.message}`)

  // Show detailed error information if available
  if (error.statusCode) {
    console.error(`Status Code: ${error.statusCode}`)
  }

  if (error.body?.error) {
    console.error(`Error: ${error.body.error}`)
  }

  if (error.body?.error_description) {
    console.error(`Description: ${error.body.error_description}`)
  }

  if (error.body && typeof error.body === 'object') {
    console.error('\nFull error response:')
    console.error(JSON.stringify(error.body, null, 2))
  }

  process.exit(1)
}

/**
 * Print CLI tool header with title
 * @param {string} title - The title to display
 */
export function printHeader (title) {
  console.log(`🎵 ${title}`)
  console.log('='.repeat(60))
}
