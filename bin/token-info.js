#!/usr/bin/env node

/**
 * @import {ArgscloptsParseArgsOptionsConfig} from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { YotoClient } from '../index.js'
import { pkg } from '../lib/pkg.cjs'
import { DEFAULT_CLIENT_ID } from '../lib/api-endpoints/constants.js'
import { decodeJwt, formatTimestamp, checkExpiration, saveTokensToEnv } from './lib/token-helpers.js'
import {
  getCommonOptions,
  loadEnvFile,
  printHeader
} from './lib/cli-helpers.js'

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  'access-token': {
    type: 'string',
    short: 'a',
    help: 'Access token to inspect (or set YOTO_ACCESS_TOKEN env var)'
  },
  'refresh-token': {
    type: 'string',
    short: 'r',
    help: 'Refresh token to inspect (or set YOTO_REFRESH_TOKEN env var)'
  },
  introspect: {
    type: 'boolean',
    short: 'i',
    help: 'Attempt to introspect token with authorization server'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-token-info',
    version: pkg.version,
    exampleFn: ({ name }) => `    Display information about Yoto OAuth tokens\n\n    Examples:\n      ${name}\n      ${name} --access-token eyJhbGc...\n      ${name} --env-file .env.local\n`
  })
  process.exit(0)
}

// Load .env file if specified or use default
const envFile = loadEnvFile(args.values['env-file'] ? String(args.values['env-file']) : undefined)
const outputFile = envFile // Use same file for output

// Get tokens from args or env
const accessToken = String(args.values['access-token'] || process.env['YOTO_ACCESS_TOKEN'] || '')
const refreshToken = String(args.values['refresh-token'] || process.env['YOTO_REFRESH_TOKEN'] || '')
const clientId = String(args.values['client-id'] || process.env['YOTO_CLIENT_ID'] || DEFAULT_CLIENT_ID)
const shouldIntrospect = Boolean(args.values['introspect'])

if (!accessToken || !refreshToken) {
  console.error('❌ Both access token and refresh token are required')
  console.error('Provide tokens via:')
  console.error('  - Command line flags: --access-token and --refresh-token')
  console.error('  - Environment variables: YOTO_ACCESS_TOKEN and YOTO_REFRESH_TOKEN')
  console.error('  - .env file (loaded automatically or specify with --env-file)')
  console.error('\n💡 Tip: Run yoto-auth to get both tokens')
  process.exit(1)
}

/**
 * Introspect token with authorization server
 * @param {string} token
 * @param {string} clientId
 * @returns {Promise<any>}
 */
async function introspectToken (token, clientId) {
  const introspectionUrl = 'https://login.yotoplay.com/oauth/introspect'

  try {
    const response = await fetch(introspectionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token,
        client_id: clientId
      })
    })

    if (response.status === 404) {
      return { error: 'not_supported', message: 'Token introspection endpoint not found (404)' }
    }

    if (response.status === 401) {
      return {
        error: 'authentication_required',
        message: 'Endpoint requires client authentication. This is typical for introspection endpoints - they require confidential clients with credentials (client secret or private key). Public clients cannot use this endpoint.'
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      return { error: 'request_failed', message: `Request failed: ${response.status} ${errorText}` }
    }

    return await response.json()
  } catch (err) {
    const error = /** @type {any} */ (err)
    return { error: 'network_error', message: error.message }
  }
}

/**
 * Display token information
 * @param {string} tokenType
 * @param {string} token
 * @param {string} clientId
 * @param {boolean} shouldIntrospect
 */
async function displayTokenInfo (tokenType, token, clientId, shouldIntrospect) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${tokenType.toUpperCase()} TOKEN`)
  console.log('='.repeat(60))

  // Check if token is a JWT (has three parts separated by dots)
  const parts = token.split('.')
  if (parts.length !== 3) {
    // Not a JWT - probably an opaque token (like refresh tokens)
    console.log('\n🔤 Token Type: Opaque Token (not a JWT)')
    console.log('\n📝 Information:')
    console.log('  This token is not a JWT and cannot be decoded.')
    console.log('  It is likely an opaque refresh token that can only')
    console.log('  be validated by the authorization server.')
    console.log('\n🔤 Token Preview:')
    if (token.length > 40) {
      console.log(`  ${token.substring(0, 20)}...${token.substring(token.length - 20)}`)
    } else {
      console.log(`  ${token}`)
    }
    console.log(`  Length: ${token.length} characters`)
    return
  }

  try {
    const decoded = decodeJwt(token)

    console.log('\n📋 Token Type: JWT')

    // Expiration
    if (decoded.exp) {
      console.log('\n⏰ Expiration:')
      console.log(`  Expires:   ${formatTimestamp(decoded.exp)}`)
      const expCheck = checkExpiration(decoded.exp)
      const statusIcon = expCheck.expired ? '❌' : '✅'
      console.log(`  Status:    ${statusIcon} ${expCheck.message}`)
    }

    // Issued at
    if (decoded.iat) {
      console.log(`  Issued:    ${formatTimestamp(decoded.iat)}`)
      const age = Math.floor(Date.now() / 1000) - decoded.iat
      const ageMinutes = Math.floor(age / 60)
      const ageHours = Math.floor(ageMinutes / 60)
      if (ageHours > 0) {
        console.log(`  Age:       ${ageHours} hour(s) ${ageMinutes % 60} minute(s)`)
      } else {
        console.log(`  Age:       ${ageMinutes} minute(s)`)
      }
    }

    // Subject and audience
    console.log('\n👤 Claims:')
    if (decoded.sub) console.log(`  Subject:   ${decoded.sub}`)
    if (decoded.aud) {
      if (Array.isArray(decoded.aud)) {
        console.log('  Audience:')
        decoded.aud.forEach((/** @type {any} */ aud) => console.log(`    - ${aud}`))
      } else {
        console.log(`  Audience:  ${decoded.aud}`)
      }
    }
    if (decoded.iss) console.log(`  Issuer:    ${decoded.iss}`)

    // Client ID verification
    if (decoded.azp || decoded.client_id) {
      const tokenClientId = decoded.azp || decoded.client_id
      console.log(`  Client ID: ${tokenClientId}`)
      if (clientId) {
        if (tokenClientId === clientId) {
          console.log('             ✅ Matches provided client ID')
        } else {
          console.log(`             ⚠️  Does NOT match provided client ID (${clientId})`)
        }
      }
    }

    // Scopes
    if (decoded.scope) {
      console.log('\n🔐 Scopes:')
      const scopes = typeof decoded.scope === 'string' ? decoded.scope.split(' ') : decoded.scope
      if (Array.isArray(scopes)) {
        scopes.forEach(scope => console.log(`  - ${scope}`))
      } else {
        console.log(`  ${scopes}`)
      }
    }

    // Permissions
    if (decoded.permissions && Array.isArray(decoded.permissions)) {
      console.log('\n🔑 Permissions:')
      decoded.permissions.forEach((/** @type {any} */ perm) => console.log(`  - ${perm}`))
    }

    // Other claims
    const standardClaims = new Set(['exp', 'iat', 'nbf', 'sub', 'aud', 'iss', 'azp', 'client_id', 'scope', 'permissions', 'alg', 'typ', 'kid'])
    const otherClaims = Object.keys(decoded).filter(key => !standardClaims.has(key))

    if (otherClaims.length > 0) {
      console.log('\n📦 Other Claims:')
      otherClaims.forEach(key => {
        const value = decoded[key]
        if (typeof value === 'object') {
          console.log(`  ${key}: ${JSON.stringify(value)}`)
        } else {
          console.log(`  ${key}: ${value}`)
        }
      })
    }

    // Raw token (first/last 20 chars)
    console.log('\n🔤 Token Preview:')
    if (token.length > 40) {
      console.log(`  ${token.substring(0, 20)}...${token.substring(token.length - 20)}`)
    } else {
      console.log(`  ${token}`)
    }
    console.log(`  Length: ${token.length} characters`)
  } catch (err) {
    const error = /** @type {any} */ (err)
    console.error(`\n❌ Error decoding ${tokenType} token:`)
    console.error(`   ${error.message}`)
    console.error('\n💡 Tip: If this is a refresh token, it may be an opaque token')
    console.error('   that cannot be decoded. This is normal for some OAuth2 implementations.')
  }

  // Introspection
  if (shouldIntrospect) {
    console.log('\n🔍 Token Introspection:')
    console.log('  Querying authorization server...')

    const introspectionResult = await introspectToken(token, clientId)

    if (introspectionResult.error) {
      if (introspectionResult.error === 'authentication_required') {
        console.log(`  ⚠️  ${introspectionResult.message}`)
      } else {
        console.log(`  ❌ ${introspectionResult.message}`)
      }
    } else if (introspectionResult.active === false) {
      console.log('  ❌ Token is INACTIVE')
    } else if (introspectionResult.active === true) {
      console.log('  ✅ Token is ACTIVE')
      if (introspectionResult.scope) {
        console.log(`  Scope:     ${introspectionResult.scope}`)
      }
      if (introspectionResult.client_id) {
        console.log(`  Client ID: ${introspectionResult.client_id}`)
      }
      if (introspectionResult.username) {
        console.log(`  Username:  ${introspectionResult.username}`)
      }
      if (introspectionResult.exp) {
        console.log(`  Expires:   ${formatTimestamp(introspectionResult.exp)}`)
      }
      if (introspectionResult.iat) {
        console.log(`  Issued:    ${formatTimestamp(introspectionResult.iat)}`)
      }
    } else {
      console.log('  ⚠️  Unexpected response:')
      console.log(`  ${JSON.stringify(introspectionResult, null, 2)}`)
    }
  }
}

printHeader('Yoto Token Information')

// Create YotoClient to show token status
let client
try {
  console.log('\n📊 Creating YotoClient instance...')
  client = new YotoClient({
    clientId,
    refreshToken,
    accessToken,
    onTokenRefresh: async (tokens) => {
      // Save tokens if they refresh during inspection
      console.log('\n⚠️  Token was refreshed during inspection! Saving...')
      const { resolvedPath } = await saveTokensToEnv(outputFile, {
        access_token: tokens.updatedAccessToken,
        refresh_token: tokens.updatedRefreshToken,
        token_type: 'Bearer',
        expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
      }, tokens.clientId)
      console.log(`✅ Updated tokens saved to ${resolvedPath}`)
    },
    onRefreshStart: () => {
      console.log('\n🔄 Token refresh triggered during inspection...')
    },
    onRefreshError: (error) => {
      console.warn('\n⚠️  Token refresh failed:', error.message)
    },
    onInvalid: (error) => {
      console.error('\n❌ Refresh token is invalid:', error.message)
    }
  })

  console.log('✅ YotoClient created successfully')
  console.log('\n🔍 Token Status from RefreshableToken:')
  console.log(`  Valid:         ${client.token.isValid() ? '✅ Yes' : '❌ No'}`)
  console.log(`  Expires At:    ${formatTimestamp(client.token.getExpiresAt())}`)

  const timeRemaining = client.token.getTimeRemaining()
  if (timeRemaining > 0) {
    const minutes = Math.floor(timeRemaining / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      console.log(`  Time Remaining: ${hours} hour(s) ${minutes % 60} minute(s)`)
    } else {
      console.log(`  Time Remaining: ${minutes} minute(s)`)
    }
  } else {
    console.log(`  Time Remaining: Expired ${Math.abs(timeRemaining)} seconds ago`)
  }
} catch (err) {
  const error = /** @type {Error} */ (err)
  console.log(`⚠️  Could not create YotoClient: ${error.message}`)
}

// Display access token info
if (accessToken) {
  await displayTokenInfo('access', accessToken, clientId, shouldIntrospect)
}

// Display refresh token info
await displayTokenInfo('refresh', refreshToken, clientId, shouldIntrospect)

console.log('\n' + '='.repeat(60))
console.log('✨ Token inspection complete')
console.log('='.repeat(60) + '\n')
