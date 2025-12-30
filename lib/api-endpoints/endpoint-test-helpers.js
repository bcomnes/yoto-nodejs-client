/**
 * Shared test helpers for loading tokens and test setup
 */

import { join } from 'node:path'
import { RefreshableToken } from '../token.js'
import { saveTokensToEnv } from '../../bin/lib/token-helpers.js'

/**
 * Load tokens from .env file for testing
 * @returns {{ token: RefreshableToken }}
 */
export function loadTestTokens () {
  const testDir = import.meta.dirname
  const envPath = join(testDir, '../..', '.env')

  // Load .env file from project root
  try {
    process.loadEnvFile(envPath)
  } catch (err) {
    console.error(`Failed to load .env file from ${envPath}`)
    console.error('Tests require YOTO_ACCESS_TOKEN and YOTO_REFRESH_TOKEN in .env')
    console.error('Run `yoto-auth` to authenticate first')
    process.exit(1)
  }

  const accessToken = process.env['YOTO_ACCESS_TOKEN']
  const refreshToken = process.env['YOTO_REFRESH_TOKEN']
  const clientId = process.env['YOTO_CLIENT_ID']

  if (!accessToken || !refreshToken || !clientId) {
    console.error('Missing required environment variables:')
    console.error('  YOTO_ACCESS_TOKEN:', accessToken ? '✓' : '✗')
    console.error('  YOTO_REFRESH_TOKEN:', refreshToken ? '✓' : '✗')
    console.error('  YOTO_CLIENT_ID:', clientId ? '✓' : '✗')
    console.error('\nRun `yoto-auth` to authenticate first')
    process.exit(1)
  }

  const token = new RefreshableToken({
    clientId,
    refreshToken,
    accessToken,
    async onTokenRefresh (tokens) {
      const { resolvedPath } = await saveTokensToEnv(envPath, {
        access_token: tokens.updatedAccessToken,
        refresh_token: tokens.updatedRefreshToken,
        token_type: 'Bearer',
        expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
      }, tokens.clientId)
      console.log(`Token Refreshed: ${resolvedPath}`)
    }
  })

  return {
    token
  }
}

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
export function logResponse (label, response) {
  console.log(`\n${label}:`)
  console.dir(response, { depth: null, colors: true })
}
