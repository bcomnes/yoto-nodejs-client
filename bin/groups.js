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
  'group-id': {
    type: 'string',
    short: 'g',
    help: 'Specific group ID to fetch'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-groups',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto family library groups information helper\n\n    Examples:\n      ${name}                    # List all family library groups\n      ${name} --group-id abc123  # Get specific group\n`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const groupId = args.values['group-id'] ? String(args.values['group-id']) : null

async function main () {
  printHeader('Yoto Family Library Groups')

  try {
    // Create client
    const client = createYotoClient({
      clientId,
      refreshToken,
      accessToken,
      outputFile: envFile
    })

    if (groupId) {
      // Get specific group
      console.log(`\nFetching group: ${groupId}\n`)
      const group = await client.getGroup({ groupId })
      console.dir(group, { depth: null, colors: true })
    } else {
      // Get all groups
      console.log('\nFetching all family library groups...\n')
      const groups = await client.getGroups()
      console.dir(groups, { depth: null, colors: true })
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
