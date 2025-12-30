#!/usr/bin/env node

/**
 * @import {ArgscloptsParseArgsOptionsConfig} from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { join } from 'node:path'
import { YotoClient } from '../index.js'
import { pkg } from '../lib/pkg.cjs'
import { DEFAULT_CLIENT_ID } from '../lib/api-endpoints/constants.js'
import { saveTokensToEnv } from './lib/token-helpers.js'
import {
  getCommonOptions,
  handleCliError,
  printHeader
} from './lib/cli-helpers.js'

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  output: {
    type: 'string',
    short: 'o',
    default: '.env',
    help: 'Output file for tokens (default: .env)'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-auth',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto device flow authentication helper\n\n    Example: ${name} --client-id your-client-id\n`
  })
  process.exit(0)
}

const clientId = String(args.values['client-id'] || process.env['YOTO_CLIENT_ID'] || DEFAULT_CLIENT_ID)

const outputFile = String(args.values['output'] || join(process.cwd(), '.env'))

async function main () {
  printHeader('Yoto Device Flow Authentication')
  console.log()

  // Step 1: Request device code
  console.log('Requesting device code...\n')

  const deviceAuth = await YotoClient.requestDeviceCode({ clientId })

  // Step 2: Display instructions to user
  console.log('┌────────────────────────────────────────────────────┐')
  console.log('│  Please complete authentication in your browser:  │')
  console.log('└────────────────────────────────────────────────────┘\n')

  if (deviceAuth.verification_uri_complete) {
    console.log('  Visit this URL (code included):')
    console.log(`  ${deviceAuth.verification_uri_complete}\n`)
    console.log('  Or manually enter:')
    console.log(`  URL:  ${deviceAuth.verification_uri}`)
    console.log(`  Code: ${deviceAuth.user_code}\n`)
  } else {
    console.log(`  URL:  ${deviceAuth.verification_uri}`)
    console.log(`  Code: ${deviceAuth.user_code}\n`)
  }

  const expiresInMinutes = Math.round(deviceAuth.expires_in / 60)
  console.log(`  Code expires in: ${expiresInMinutes} minute(s)`)
  console.log(`  Polling every:   ${deviceAuth.interval} second(s)\n`)

  // Step 3: Wait for authorization (with automatic polling)
  console.log('Waiting for authorization...')

  try {
    const tokens = await YotoClient.waitForDeviceAuthorization({
      deviceCode: deviceAuth.device_code,
      clientId,
      initialInterval: deviceAuth.interval * 1000,
      expiresIn: deviceAuth.expires_in,
      onPoll: (result) => {
        if (result.status === 'pending') {
          process.stdout.write('.')
        } else if (result.status === 'slow_down') {
          console.log(`\n⚠️  Slowing down polling to ${result.interval / 1000}s...`)
        }
      }
    })

    // Success! Save tokens to .env file
    console.log('\n✅ Authorization successful!\n')

    const { resolvedPath } = await saveTokensToEnv(outputFile, tokens, clientId)

    console.log(`✨ Tokens saved to ${resolvedPath}`)
    console.log('\nYou can now use these environment variables:')
    console.log('  - YOTO_ACCESS_TOKEN')
    console.log('  - YOTO_REFRESH_TOKEN')
    console.log('  - YOTO_CLIENT_ID')

    process.exit(0)
  } catch (err) {
    const error = /** @type {any} */ (err)
    if (error.message === 'Device code has expired') {
      console.error('\n❌ Device code has expired. Please run the command again.')
      process.exit(1)
    } else if (error.body?.error === 'expired_token') {
      console.error('\n❌ Device code has expired. Please run the command again.')
      process.exit(1)
    } else {
      handleCliError(error)
    }
  }
}

// Run the main function
await main().catch(handleCliError)
