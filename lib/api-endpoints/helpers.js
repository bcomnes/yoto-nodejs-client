/**
 * @import { Dispatcher } from 'undici'
 * @import { request } from 'undici'
 */
import { pkg } from '../pkg.cjs'
import os from 'node:os'

/**
 * Request options derived from undici.request
 * @typedef {NonNullable<Parameters<typeof request>[1]>} RequestOptions
 */

/**
 * @param {object} [options]
 * @param {string} [options.userAgent] - Optional user agent string to prepend to library user agent
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 */
export function defaultHeaders (options = {}) {
  const libraryAgent = `${pkg.name}/${pkg.version} (${os.type()})`
  const userAgent = options.userAgent
    ? `${options.userAgent} ${libraryAgent}`
    : libraryAgent

  return {
    Accept: 'application/json',
    'User-Agent': userAgent
  }
}

/**
 * @param  {object} params
 * @param  {string} params.accessToken
 * @param {string} [params.userAgent] - Optional user agent string to prepend to library user agent
 */
export function defaultAuthHeaders ({ accessToken: token, userAgent }) {
  return {
    ...defaultHeaders({ userAgent }),
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Merge undici request options with defaults
 * Properly merges headers by supplementing rather than overriding
 * Only supports object headers (not arrays)
 * @param {RequestOptions} baseOptions - Base request options with headers
 * @param {RequestOptions} [requestOptions] - Additional request options to merge
 * @returns {object} Merged options
 */
export function mergeRequestOptions (baseOptions, requestOptions) {
  if (!requestOptions) return baseOptions

  // Extract headers from both options
  const { headers: baseHeaders, ...baseRest } = baseOptions
  const { headers: requestHeaders, ...requestRest } = requestOptions

  // Merge headers - only support object headers
  const mergedHeaders = {
    ...(baseHeaders || {}),
    ...(requestHeaders || {})
  }

  return {
    ...baseRest,
    ...requestRest,
    headers: mergedHeaders
  }
}

/**
 * @param  {Dispatcher.ResponseData} response
 * @param  {any} [extra]
 */
export async function handleBadResponse (response, extra) {
  if (response.statusCode > 299) {
    const textBody = await response.body.text()
    let jsonBody = null

    try {
      jsonBody = JSON.parse(textBody)
    } catch {
      jsonBody = null
    }

    throw new YotoAPIError(response, textBody, jsonBody, extra)
  }
}

export class YotoAPIError extends Error {
  /** @type { number } */ statusCode
  /** @type {string} */ textBody
  /** @type {unknown | null} */ jsonBody
  /** @type {any} */ extra

  /**
   * @param  {Dispatcher.ResponseData} response A undici Response
   * @param  {string} textBody response body as text
   * @param  {unknown | null} jsonBody parsed response body (or null if invalid JSON)
   * @param  {any} [extra] any extra info to attach to the error
   */
  constructor (response, textBody, jsonBody, extra) {
    super('Unexpected response status code')
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)

    this.statusCode = response.statusCode
    this.textBody = textBody
    this.jsonBody = jsonBody
    this.extra = extra
  }
}
