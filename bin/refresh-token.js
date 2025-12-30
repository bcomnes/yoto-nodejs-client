#!/usr/bin/env node

/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { YotoClient } from '../lib/api-client.js'
import { pkg } from '../lib/pkg.cjs'
import { saveTokensToEnv } from './lib/token-helpers.js'
import {
  getCommonOptions,
  loadEnvFile,
  printHeader,
  handleCliError
} from './lib/cli-helpers.js'
import { DEFAULT_CLIENT_ID } from '../lib/api-endpoints/constants.js'
import { join } from 'node:path'

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  'refresh-token': {
    type: 'string',
    short: 'r',
    help: 'Refresh token to use (or set YOTO_REFRESH_TOKEN env var)'
  },
  output: {
    type: 'string',
    short: 'o',
    default: '.env',
    help: 'Output file for tokens (default: .env)'
  },
  force: {
    type: 'boolean',
    short: 'f',
    help: 'Force refresh even if token is not expired'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-refresh-token',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto token refresh helper\n\n    Examples:\n      ${name}\n      ${name} --force\n      ${name} --env-file .env.local\n`
  })
  process.exit(0)
}

// Load .env file if specified or use default
const outputFile = String(args.values['output'] || join(process.cwd(), '.env'))
loadEnvFile(args.values['env-file'] ? String(args.values['env-file']) : outputFile)

const clientId = String(args.values['client-id'] || process.env['YOTO_CLIENT_ID'] || DEFAULT_CLIENT_ID)
const refreshToken = String(args.values['refresh-token'] || process.env['YOTO_REFRESH_TOKEN'] || '')
const accessToken = String(process.env['YOTO_ACCESS_TOKEN'] || '')
const force = Boolean(args.values['force'])

if (!refreshToken) {
  console.error('❌ No refresh token found')
  console.error('Provide a refresh token via:')
  console.error('  - Command line flag: --refresh-token')
  console.error('  - Environment variable: YOTO_REFRESH_TOKEN')
  console.error('  - .env file (loaded automatically or specify with --env-file)')
  console.error('\n💡 Tip: Run yoto-auth to get a refresh token')
  process.exit(1)
}

if (!accessToken) {
  console.error('❌ No access token found')
  console.error('Provide an access token via:')
  console.error('  - Environment variable: YOTO_ACCESS_TOKEN')
  console.error('  - .env file (loaded automatically or specify with --env-file)')
  console.error('\n💡 Tip: Run yoto-auth to get an access token')
  process.exit(1)
}

async function main () {
  printHeader('Yoto Token Refresh')

  try {
    // Create client with token refresh handler
    const client = new YotoClient({
      clientId,
      refreshToken,
      accessToken,
      onTokenRefresh: async (tokens) => {
        // This will be called after successful refresh
        // Convert RefreshSuccessEvent to YotoTokenResponse format
        const { resolvedPath } = await saveTokensToEnv(outputFile, {
          access_token: tokens.updatedAccessToken,
          refresh_token: tokens.updatedRefreshToken,
          token_type: 'Bearer',
          expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
        }, tokens.clientId)
        console.log(`Token Refreshed: ${resolvedPath}`)
      },
      onRefreshStart: () => {
        console.log('\n🔄 Refreshing tokens...')
      },
      onRefreshError: (error) => {
        console.error('\n⚠️  Token refresh failed:', error.message)
      },
      onInvalid: (error) => {
        console.error('\n❌ Refresh token is invalid or expired')
        console.error(error.message)
        console.error('\n💡 Tip: Run yoto-auth to get a new set of tokens.')
      }
    })

    // Check if token needs refresh
    if (!force && client.token.isValid()) {
      const timeRemaining = client.token.getTimeRemaining()
      const minutes = Math.floor(timeRemaining / 60)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) {
        console.log(`\n✅ Token is still valid for ${hours} hour(s) ${minutes % 60} minute(s)`)
      } else {
        console.log(`\n✅ Token is still valid for ${minutes} minute(s)`)
      }
      console.log('💡 Use --force to refresh anyway')
      process.exit(0)
    }

    if (force) {
      console.log('\n⚡ Forcing token refresh...')
    } else {
      console.log('\n⚠️  Token needs refresh')
    }

    // Manually trigger refresh
    const tokens = await client.token.refresh()

    console.log('\n✅ Token refresh successful!')

    // Show expiration info
    const expiresDate = new Date(tokens.updatedExpiresAt * 1000)
    const timeRemaining = tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
    const minutes = Math.floor(timeRemaining / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      console.log(`⏰ New token valid for ${hours} hour(s) ${minutes % 60} minute(s)`)
    } else {
      console.log(`⏰ New token valid for ${minutes} minute(s)`)
    }
    console.log(`   Expires: ${expiresDate.toISOString()}`)

    console.log(`\n✨ Tokens saved to ${outputFile}`)
    console.log('\nYou can now use these environment variables:')
    console.log('  - YOTO_ACCESS_TOKEN')
    console.log('  - YOTO_REFRESH_TOKEN')
    console.log('  - YOTO_CLIENT_ID')

    process.exit(0)
  } catch (error) {
    handleCliError(error)
  }
}

// Run the main function
await main().catch(err => {
  console.error('\n❌ Unexpected error:')
  console.error(err)
  process.exit(1)
})
