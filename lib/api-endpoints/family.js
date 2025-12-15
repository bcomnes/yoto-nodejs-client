/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultAuthHeaders, handleBadResponse, mergeRequestOptions } from './helpers.js'
import { YOTO_API_URL } from './constants.js'

// ============================================================================
// Family: Family endpoints for managing family groups and images
// ============================================================================

/**
 * @see https://yoto.dev/api/getfamilyimages/
 * @typedef {Object} YotoFamilyImagesResponse
 * @property {YotoFamilyImage[]} images
 */

/**
 * @see https://yoto.dev/api/getfamilyimages/
 * @typedef {Object} YotoFamilyImage
 * @property {string} imageId - The unique identifier for the family image (hash)
 * @property {string} [name] - Optional name of the family image
 */

/**
 * Retrieves the list of families associated with the authenticated user.
 * @see https://yoto.dev/api/getfamilyimages/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoFamilyImagesResponse>} The user's families
 */
export async function getFamilyImages ({
  accessToken,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/media/family/images', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoFamilyImagesResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/getafamilyimage/
 * @typedef {Object} YotoFamilyImageResponse
 * @property {string} imageUrl - The signed URL to the family image (expires after 7 days)
 */

/**
 * Retrieves a signed URL for a specific family image. Returns a 302 redirect with the image URL in the Location header.
 * The signed URL expires after 7 days.
 * @see https://yoto.dev/api/getafamilyimage/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.imageId The family image ID (hash) to get the image for
 * @param  {'640x480' | '320x320'} options.size Image dimensions (supported: '640x480' or '320x320')
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoFamilyImageResponse>} The signed image URL
 */
export async function getAFamilyImage ({
  accessToken,
  userAgent,
  imageId,
  size,
  requestOptions
}) {
  const requestUrl = new URL(`/media/family/images/${imageId}`, YOTO_API_URL)

  // Map size string to width and height
  const dimensions = size === '640x480' ? { width: 640, height: 480 } : { width: 320, height: 320 }

  requestUrl.searchParams.set('width', dimensions.width.toString())
  requestUrl.searchParams.set('height', dimensions.height.toString())

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  // 302 is expected for successful image requests
  if (response.statusCode !== 302) {
    await handleBadResponse(response, { imageId })
  }

  // Get the signed URL from the Location header
  const locationHeaders = response.headers['location']
  const imageUrl = Array.isArray(locationHeaders) ? locationHeaders[0] : locationHeaders

  if (!imageUrl) {
    throw new Error('No Location header found in 302 response')
  }

  return {
    imageUrl
  }
}

/**
 * @see https://yoto.dev/api/uploadafamilyimage/
 * @typedef {Object} YotoUploadFamilyImageResponse
 * @property {string} imageId - The SHA256 checksum of the uploaded image
 * @property {string} url - URL to the 'get a family image' endpoint (requires width/height params)
 */

/**
 * Uploads a family image for use across various features in Yoto.
 * Images are deduplicated using SHA256 checksums.
 *
 * Constraints:
 * - Max size: 8mb
 * - Supported formats: JPEG, GIF, PNG
 * - Limit: 500 images per family
 * - No restrictions on resolution or aspect ratio
 *
 * @see https://yoto.dev/api/uploadafamilyimage/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {Buffer} options.imageData The binary image data (JPEG, GIF, or PNG)
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoUploadFamilyImageResponse>} The uploaded image details
 * @example
 * import { readFile } from 'fs/promises'
 * import { uploadAFamilyImage } from 'yoto-nodejs-client'
 *
 * const imageData = await readFile('./family-photo.jpg')
 * const result = await uploadAFamilyImage({
 *   accessToken,
 *   imageData
 * })
 *
 * console.log('Image ID:', result.imageId)
 * console.log('Image URL:', result.url)
 */
export async function uploadAFamilyImage ({
  accessToken,
  userAgent,
  imageData,
  requestOptions
}) {
  const requestUrl = new URL('/media/family/images', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers: {
      ...defaultAuthHeaders({ accessToken, userAgent }),
      'Content-Type': 'application/octet-stream'
    },
    body: imageData
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoUploadFamilyImageResponse} */ (await response.body.json())
  return responseBody
}
