#!/usr/bin/env node

/**
 * @import {ArgscloptsParseArgsOptionsConfig} from 'argsclopts'
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
  public: {
    type: 'boolean',
    short: 'p',
    help: 'Show only public Yoto icons'
  },
  user: {
    type: 'boolean',
    short: 'u',
    help: 'Show only user custom icons'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-icons',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto icons information helper\n\n    Examples:\n      ${name}                # List both public and user icons\n      ${name} --public       # List only public Yoto icons\n      ${name} --user         # List only user custom icons\n`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const showPublic = Boolean(args.values['public'])
const showUser = Boolean(args.values['user'])

// If neither flag is set, show both
const showBoth = !showPublic && !showUser

async function main () {
  printHeader('Yoto Icons')

  try {
    // Create client
    const client = createYotoClient({
      clientId,
      refreshToken,
      accessToken,
      outputFile: envFile
    })

    if (showPublic || showBoth) {
      console.log('\nFetching public Yoto icons...\n')
      const publicIcons = await client.getPublicIcons()

      if (showBoth) {
        console.log('Public Icons:')
      }
      console.dir(publicIcons, { depth: null, colors: true })
    }

    if (showUser || showBoth) {
      if (showBoth) {
        console.log('\n' + '='.repeat(60) + '\n')
      }
      console.log('\nFetching user custom icons...\n')
      const userIcons = await client.getUserIcons()

      if (showBoth) {
        console.log('User Icons:')
      }
      console.dir(userIcons, { depth: null, colors: true })
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
