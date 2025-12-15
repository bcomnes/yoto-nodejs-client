#!/usr/bin/env node

/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { pkg } from '../lib/pkg.cjs'
import {
  getCommonOptions,
  loadTokensFromEnv,
  createYotoClient,
  handleCliError,
  printHeader
} from './lib/cli-helpers.js'

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  'card-id': {
    type: 'string',
    short: 'd',
    help: 'Specific card/content ID to fetch'
  },
  'show-deleted': {
    type: 'boolean',
    help: 'Include deleted content (for MYO content list)'
  },
  timezone: {
    type: 'string',
    short: 't',
    help: 'Timezone identifier (e.g., "Pacific/Auckland")'
  },
  'signing-type': {
    type: 'string',
    short: 's',
    help: 'Type of URL signing: "full" or "pre"'
  },
  playable: {
    type: 'boolean',
    short: 'p',
    help: 'Return playable signed URLs'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-content',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto content information helper\n\n    Examples:\n      ${name}                                    # List all MYO content\n      ${name} --show-deleted                     # List all MYO content including deleted\n      ${name} --card-id abc123                   # Get specific content\n      ${name} --card-id abc123 --playable        # Get content with playable URLs\n      ${name} --card-id abc123 --timezone "Pacific/Auckland" --signing-type full --playable\n`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const cardId = args.values['card-id'] ? String(args.values['card-id']) : null
const showDeleted = Boolean(args.values['show-deleted'])
const timezone = args.values['timezone'] ? String(args.values['timezone']) : undefined
const signingType = args.values['signing-type'] ? /** @type {'full' | 'pre'} */ (String(args.values['signing-type'])) : undefined
const playable = Boolean(args.values['playable'])

// Validate signing-type if provided
if (signingType && signingType !== 'full' && signingType !== 'pre') {
  console.error('❌ Invalid --signing-type value')
  console.error('Valid values: "full" or "pre"')
  process.exit(1)
}

async function main () {
  printHeader('Yoto Content')

  try {
    // Create client
    const client = createYotoClient({
      clientId,
      refreshToken,
      accessToken,
      outputFile: envFile
    })

    if (cardId) {
      // Get specific content
      console.log(`\nFetching content: ${cardId}\n`)
      const content = await client.getContent({
        cardId,
        ...(timezone && { timezone }),
        ...(signingType && { signingType }),
        ...(playable && { playable })
      })
      console.dir(content, { depth: null, colors: true })
    } else {
      // Get all MYO content
      console.log(`\nFetching all MYO content${showDeleted ? ' (including deleted)' : ''}...\n`)
      const myoContent = await client.getUserMyoContent({
        ...(showDeleted && { showDeleted })
      })
      console.dir(myoContent, { depth: null, colors: true })
    }

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
