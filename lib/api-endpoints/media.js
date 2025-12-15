/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultAuthHeaders, handleBadResponse, mergeRequestOptions } from './helpers.js'
import { YOTO_API_URL } from './constants.js'

// ============================================================================
// Media: Media endpoints for audio uploads and cover images
//
// Audio Transcoding:
// - All uploaded audio files are transcoded using FFmpeg
// - Converted to MP4 format with AAC codec (libfdk_aac)
// - Bit Rate: 128Kbps, Sample Rate: 11.025/22.05/44.1/48 kHz
// - Files are transcoded to balance quality vs compression for players
// - Maximum file size: 1GB (arbitrary limit to prevent timeout/corruption)
// ============================================================================

/**
 * @see https://yoto.dev/api/getanuploadurl/
 * @typedef {Object} YotoAudioUpload
 * @property {string} uploadId - Upload identifier
 * @property {string | null} uploadUrl - Signed upload URL, or null if file already exists
 */

/**
 * @see https://yoto.dev/api/getanuploadurl/
 * @typedef {Object} YotoAudioUploadUrlResponse
 * @property {YotoAudioUpload} upload
 */

/**
 * @see https://yoto.dev/api/uploadcoverimage/
 * @typedef {Object} YotoCoverImage
 * @property {string} mediaId - Media identifier
 * @property {string} mediaUrl - URL to access the uploaded cover image
 */

/**
 * @see https://yoto.dev/api/uploadcoverimage/
 * @typedef {Object} YotoUploadCoverImageResponse
 * @property {YotoCoverImage} coverImage
 */

/**
 * @see https://yoto.dev/api/uploadcoverimage/
 * @typedef {'default' | 'activities' | 'music' | 'myo' | 'podcast' | 'radio' | 'sfx' | 'stories'} YotoCoverType
 */

/**
 * Get a signed URL for uploading an audio file. The SHA256 hash is used to check
 * if a file with that checksum already exists (deduplication).
 *
 * Response behavior:
 * - If file already exists: uploadUrl will be null (file is already in store)
 * - If file doesn't exist: uploadUrl contains a signed URL for uploading
 * - uploadId is always returned and can be used to reference the upload
 *
 * @see https://yoto.dev/api/getanuploadurl/
 * @param {object} options
 * @param {string} options.accessToken - Authentication token
 * @param {string} options.sha256 - SHA256 hash of the file to upload
 * @param {string} [options.filename] - Optional filename for the uploaded file
 * @param {string} [options.userAgent] - Optional user agent string
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 * @returns {Promise<YotoAudioUploadUrlResponse>}
 */
export async function getAudioUploadUrl ({
  accessToken,
  userAgent,
  sha256,
  filename,
  requestOptions
}) {
  const requestUrl = new URL('/media/transcode/audio/uploadUrl', YOTO_API_URL)

  requestUrl.searchParams.set('sha256', sha256)
  if (filename) requestUrl.searchParams.set('filename', filename)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response, { sha256 })

  const responseBody = /** @type {YotoAudioUploadUrlResponse} */ (await response.body.json())
  return responseBody
}

/**
 * Upload a cover image to the user's media account. Supports both direct binary
 * uploads and fetching from a URL. Images are automatically resized based on coverType.
 *
 * Image processing:
 * - Images are resized according to coverType (default: 638x1011px)
 * - Aspect ratio is preserved
 * - Images are cropped to fit dimensions, positioned to center
 * - Supports automatic image conversion with autoConvert flag
 *
 * Cover type dimensions:
 * - default/activities/music/sfx/stories: 638×1011px
 * - myo: 520×400px
 * - podcast/radio: 600×600px
 *
 * @see https://yoto.dev/api/uploadcoverimage/
 * @param {object} options
 * @param {string} options.accessToken - Authentication token
 * @param {Buffer | Uint8Array | string} [options.imageData] - Binary image data to upload (required if imageUrl not provided)
 * @param {string} [options.imageUrl] - URL of image to fetch and upload (required if imageData not provided)
 * @param {boolean} [options.autoConvert] - Whether to automatically convert the image
 * @param {YotoCoverType} [options.coverType] - Type of cover image, determines dimensions
 * @param {string} [options.filename] - Custom filename for the uploaded image
 * @param {string} [options.userAgent] - Optional user agent string
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 * @returns {Promise<YotoUploadCoverImageResponse>}
 */
export async function uploadCoverImage ({
  accessToken,
  userAgent,
  imageData,
  imageUrl,
  autoConvert,
  coverType,
  filename,
  requestOptions
}) {
  const requestUrl = new URL('/media/coverImage/user/me/upload', YOTO_API_URL)

  if (imageUrl) requestUrl.searchParams.set('imageUrl', imageUrl)
  if (autoConvert !== undefined) requestUrl.searchParams.set('autoconvert', autoConvert.toString())
  if (coverType) requestUrl.searchParams.set('coverType', coverType)
  if (filename) requestUrl.searchParams.set('filename', filename)

  // Build headers - add Content-Type for binary uploads
  const headers = imageData
    ? {
        ...defaultAuthHeaders({ accessToken, userAgent }),
        'Content-Type': 'application/octet-stream'
      }
    : defaultAuthHeaders({ accessToken, userAgent })

  const baseRequestOptions = {
    method: 'POST',
    headers,
    ...(imageData && { body: imageData })
  }

  const response = await request(requestUrl, mergeRequestOptions(baseRequestOptions, requestOptions))

  await handleBadResponse(response, { imageUrl, filename })

  const responseBody = /** @type {YotoUploadCoverImageResponse} */ (await response.body.json())
  return responseBody
}
