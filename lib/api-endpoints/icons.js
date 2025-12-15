/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultAuthHeaders, handleBadResponse, mergeRequestOptions } from './helpers.js'
import { YOTO_API_URL } from './constants.js'

// ============================================================================
// Icons: Display icon endpoints for public and custom user icons
// ============================================================================

/**
 * @see https://yoto.dev/api/getpublicicons/
 * @typedef {Object} YotoPublicIconsResponse
 * @property {YotoPublicIcon[]} displayIcons - Array of public display icons
 */

/**
 * @see https://yoto.dev/api/getpublicicons/
 * @typedef {Object} YotoPublicIcon
 * @property {string} displayIconId - Unique identifier for the icon
 * @property {string} mediaId - Unique identifier for the underlying icon file
 * @property {string} userId - ID of the user who uploaded this icon (always "yoto" for public icons)
 * @property {string} createdAt - ISO 8601 timestamp when icon record was created
 * @property {string} title - Title of the display icon
 * @property {string} url - URL of the display icon
 * @property {boolean} public - Indicates if the icon is public (always true for public icons)
 * @property {boolean} [new] - Indicates if this is a new icon (may not always be present)
 * @property {string[]} publicTags - Public tags associated with the display icon
 */

/**
 * Retrieves the list of public icons that are available to every user.
 * @see https://yoto.dev/api/getpublicicons/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoPublicIconsResponse>} Public display icons
 * @example
 * import { getPublicIcons } from 'yoto-nodejs-client'
 *
 * const icons = await getPublicIcons({
 *   accessToken
 * })
 *
 * console.log(`Found ${icons.displayIcons.length} public icons`)
 * icons.displayIcons.forEach(icon => {
 *   console.log(`${icon.title} - Tags: ${icon.publicTags.join(', ')}`)
 * })
 */
export async function getPublicIcons ({
  accessToken,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/media/displayIcons/user/yoto', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoPublicIconsResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/getusericons/
 * @typedef {Object} YotoUserIconsResponse
 * @property {YotoUserIcon[]} displayIcons - Array of user's custom display icons
 */

/**
 * @see https://yoto.dev/api/getusericons/
 * @typedef {Object} YotoUserIcon
 * @property {string} displayIconId - Unique identifier for the icon
 * @property {string} mediaId - Unique identifier for the underlying icon file
 * @property {string} userId - ID of the user who uploaded this icon
 * @property {string} createdAt - ISO 8601 timestamp when icon record was created
 * @property {string} url - URL of the display icon
 * @property {boolean} public - Indicates if the icon is public (always false for user icons)
 */

/**
 * Retrieves the authenticated user's custom uploaded icons.
 * @see https://yoto.dev/api/getusericons/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoUserIconsResponse>} User's custom display icons
 */
export async function getUserIcons ({
  accessToken,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/media/displayIcons/user/me', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoUserIconsResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/uploadcustomicon/
 * @typedef {Object} YotoUploadIconResponse
 * @property {YotoDisplayIcon} displayIcon - The uploaded or existing display icon
 */

/**
 * @see https://yoto.dev/api/uploadcustomicon/
 * @typedef {Object} YotoDisplayIcon
 * @property {string} displayIconId - Unique identifier for the icon
 * @property {string} mediaId - Unique identifier for the underlying icon file
 * @property {string} userId - ID of the user who uploaded this icon
 * @property {string | object} url - URL of the display icon, or empty object {} for duplicates
 * @property {boolean} [new] - True if this is a new upload, undefined for duplicates
 * @property {string} [_id] - MongoDB ID (present for duplicate uploads)
 * @property {string} [createdAt] - ISO 8601 timestamp (present for duplicate uploads)
 */

/**
 * Uploads a custom 16×16px icon for the authenticated user.
 * Icons are deduplicated by content - re-uploading the same image returns the existing icon.
 *
 * Image processing with autoConvert=true (recommended):
 * - Auto-resizes to 16×16px (crop/pad as needed)
 * - Adjusts brightness if > ⅔
 * - Converts to PNG
 * - Accepts any image format
 *
 * Image requirements with autoConvert=false (strict):
 * - Must be exactly 16×16px
 * - Only PNG or GIF allowed
 * - PNG must be 24-bit RGBA (sRGB, 4 channels, hasAlpha, no palette)
 * - GIF accepted as-is
 *
 * @see https://yoto.dev/api/uploadcustomicon/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {Buffer} options.imageData The binary image data (16×16px icon)
 * @param  {boolean} [options.autoConvert=true] Auto-resize and process the image to 16×16px
 * @param  {string} [options.filename] Override the stored base filename
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoUploadIconResponse>} The uploaded or existing display icon
 * @example
 * import { readFile } from 'fs/promises'
 * import { uploadIcon } from 'yoto-nodejs-client'
 *
 * const imageData = await readFile('./my-icon.png')
 * const result = await uploadIcon({
 *   accessToken,
 *   imageData,
 *   autoConvert: true,
 *   filename: 'my-custom-icon'
 * })
 *
 * if (result.displayIcon.new) {
 *   console.log('New icon uploaded:', result.displayIcon.displayIconId)
 * } else {
 *   console.log('Icon already exists:', result.displayIcon.displayIconId)
 * }
 */
export async function uploadIcon ({
  accessToken,
  userAgent,
  imageData,
  autoConvert = true,
  filename,
  requestOptions
}) {
  const requestUrl = new URL('/media/displayIcons/user/me/upload', YOTO_API_URL)

  if (autoConvert !== undefined) requestUrl.searchParams.set('autoConvert', autoConvert.toString())
  if (filename) requestUrl.searchParams.set('filename', filename)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers: {
      ...defaultAuthHeaders({ accessToken, userAgent }),
      'Content-Type': 'application/octet-stream'
    },
    body: imageData
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoUploadIconResponse} */ (await response.body.json())
  return responseBody
}
