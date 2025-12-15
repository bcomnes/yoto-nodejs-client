/**
 * Shared test helpers for loading tokens and test setup
 */

import { join } from 'node:path'

/**
 * Load tokens from .env file for testing
 * @returns {{accessToken: string, refreshToken: string, clientId: string}}
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

  if (!accessToken || !refreshToken) {
    console.error('Missing required environment variables:')
    console.error('  YOTO_ACCESS_TOKEN:', accessToken ? '✓' : '✗')
    console.error('  YOTO_REFRESH_TOKEN:', refreshToken ? '✓' : '✗')
    console.error('\nRun `yoto-auth` to authenticate first')
    process.exit(1)
  }

  return {
    accessToken,
    refreshToken,
    clientId: clientId || ''
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
