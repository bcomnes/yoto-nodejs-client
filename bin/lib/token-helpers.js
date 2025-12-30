/**
 * @import {YotoTokenResponse} from '../../lib/api-endpoints/auth.js'
 */

import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { jwtDecode } from 'jwt-decode'

/**
 * Format timestamp
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTimestamp (timestamp) {
  const date = new Date(timestamp * 1000)
  return date.toISOString()
}

/**
 * Check if token is expired
 * @param {number} exp
 * @param {number} bufferSeconds
 * @returns {{expired: boolean, message: string}}
 */
export function checkExpiration (exp, bufferSeconds = 30) {
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = exp - now

  if (timeUntilExpiry < 0) {
    return { expired: true, message: `Expired ${Math.abs(timeUntilExpiry)} seconds ago` }
  } else if (timeUntilExpiry < bufferSeconds) {
    return { expired: true, message: `Expires in ${timeUntilExpiry} seconds (within buffer)` }
  } else {
    const minutes = Math.floor(timeUntilExpiry / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return { expired: false, message: `Valid for ${hours} hour(s) ${minutes % 60} minute(s)` }
    } else {
      return { expired: false, message: `Valid for ${minutes} minute(s)` }
    }
  }
}

/**
 * Check if a JWT token is expired or about to expire
 * @param {string} token - JWT token to check
 * @param {number} bufferSeconds - Seconds before expiration to consider expired
 * @returns {{expired: boolean, message: string}}
 */
export function checkTokenExpiration (token, bufferSeconds = 30) {
  try {
    const decoded = jwtDecode(token)
    if (!decoded.exp) {
      return { expired: true, message: 'Token has no expiration claim' }
    }

    return checkExpiration(decoded.exp, bufferSeconds)
  } catch (err) {
    return { expired: true, message: 'Unable to decode token' }
  }
}

/**
 * Decode a JWT token without verification
 * @param {string} token
 * @returns {any}
 */
export function decodeJwt (token) {
  try {
    return jwtDecode(token)
  } catch (err) {
    const error = /** @type {any} */ (err)
    throw new Error(`Failed to decode JWT: ${error.message}`)
  }
}

/**
 * Save tokens to .env file
 * @param {string} envFilePath file path
 * @param {YotoTokenResponse} tokens
 * @param {string} clientId
 */
export async function saveTokensToEnv (envFilePath, tokens, clientId) {
  let existingContent = ''

  const resolvedPath = resolve(envFilePath)

  // Read existing .env file if it exists
  try {
    existingContent = await fs.readFile(envFilePath, 'utf8')
  } catch (err) {
    // File doesn't exist, that's okay
  }

  // Parse existing content and remove old Yoto tokens (including comment lines)
  const lines = existingContent.split('\n').filter(line => {
    const trimmed = line.trim()
    return !trimmed.startsWith('YOTO_ACCESS_TOKEN=') &&
           !trimmed.startsWith('YOTO_REFRESH_TOKEN=') &&
           !trimmed.startsWith('YOTO_CLIENT_ID=') &&
           !trimmed.startsWith('# Yoto API tokens') &&
           !trimmed.startsWith('# Saved at:') &&
           !trimmed.startsWith('# Access token expires:')
  })

  // Remove trailing empty lines
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1]
    if (lastLine && lastLine.trim() === '') {
      lines.pop()
    } else {
      break
    }
  }

  // Get token expiration for comment
  let expirationComment = ''
  try {
    const decoded = decodeJwt(tokens.access_token)
    if (decoded.exp) {
      expirationComment = `# Access token expires: ${formatTimestamp(decoded.exp)}\n`
    }
  } catch (err) {
    // If we can't decode, just skip the expiration comment
  }

  const now = new Date().toISOString()

  // Add new tokens (only add leading blank line if file has content)
  if (lines.length > 0 && lines[lines.length - 1] !== '') {
    lines.push('')
  }
  lines.push('# Yoto API tokens')
  lines.push(`# Saved at: ${now}`)
  if (expirationComment) lines.push(expirationComment.trim())
  lines.push(`YOTO_ACCESS_TOKEN=${tokens.access_token}`)
  lines.push(`YOTO_REFRESH_TOKEN=${tokens.refresh_token}`)
  lines.push(`YOTO_CLIENT_ID=${clientId}`)

  // Write back to file
  await fs.writeFile(envFilePath, lines.join('\n'), 'utf8')

  return { resolvedPath }
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms
 */
export async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
