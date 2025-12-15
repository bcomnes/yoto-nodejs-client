/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultAuthHeaders, handleBadResponse, mergeRequestOptions } from './helpers.js'
import { YOTO_API_URL } from './constants.js'

// ============================================================================
// Content: Content endpoints for managing playlists and cards
// ============================================================================

// Shared types used across multiple content endpoints

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'none' | 'stories' | 'music' | 'radio' | 'podcast' | 'sfx' | 'activities' | 'alarms'} YotoCategory
 */

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'mp3' | 'aac' | 'opus' | 'ogg'} YotoAudioFormat
 */

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'en' | 'en-gb' | 'en-us' | 'fr' | 'fr-fr' | 'es' | 'es-es' | 'es-419' | 'de' | 'it'} YotoLanguage
 */

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'new' | 'inprogress' | 'complete' | 'live' | 'archived'} YotoStatusName
 */

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'DESC' | 'ASC'} YotoPlaybackDirection
 */

/**
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {'linear' | 'interactive'} YotoPlaybackType
 */

/**
 * @see https://yoto.dev/myo/how-playlists-work/
 * @typedef {Object} YotoTrackDisplay
 * @property {string} icon16x16 - Track icon (16x16px) in format "yoto:#<sha256-hash>"
 */

/**
 * @see https://yoto.dev/myo/how-playlists-work/
 * @typedef {'audio' | 'stream'} YotoTrackType
 */

/**
 * @see https://yoto.dev/myo/how-playlists-work/
 * @typedef {'stereo' | 'mono'} YotoChannels
 */

/**
 * A track represents a single audio file within a chapter.
 * Tracks within a chapter play in sequence.
 * @see https://yoto.dev/myo/how-playlists-work/
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/api/getusersmyocontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoTrack
 * @property {string} key - Track identifier
 * @property {string} title - Track title
 * @property {string} trackUrl - Track URL in format "yoto:#<sha256-hash>"
 * @property {YotoAudioFormat} format - Audio format
 * @property {YotoTrackType} type - Track type ("audio" or "stream")
 * @property {string} overlayLabel - Display label shown on player
 * @property {number} duration - Track duration in seconds
 * @property {number} fileSize - File size in bytes
 * @property {YotoChannels} channels - Audio channels (stereo or mono)
 * @property {any | null} ambient - Ambient setting for track
 * @property {YotoTrackDisplay} display - Display configuration with icon
 * @property {string | null} [uid] - Optional unique identifier
 * @property {string | null} [overlayLabelOverride] - Optional override for overlay label
 */

/**
 * @see https://yoto.dev/myo/how-playlists-work/
 * @typedef {Object} YotoChapterDisplay
 * @property {string} icon16x16 - Chapter icon (16x16px) in format "yoto:#<sha256-hash>"
 */

/**
 * A chapter contains one or more tracks and has its own title and icon.
 * A playlist is made up of one or more chapters.
 * @see https://yoto.dev/myo/how-playlists-work/
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoChapter
 * @property {string} key - Chapter identifier
 * @property {string} title - Chapter title
 * @property {YotoTrack[]} tracks - Array of tracks in this chapter
 * @property {YotoChapterDisplay} display - Display configuration with icon
 * @property {string} overlayLabel - Overlay label shown on player
 * @property {number} duration - Total chapter duration in seconds
 * @property {number} fileSize - Total chapter file size in bytes
 * @property {any | null} availableFrom - Availability date/time
 * @property {any | null} ambient - Ambient setting for chapter
 * @property {string | null} defaultTrackDisplay - Default track display setting
 * @property {string | null} defaultTrackAmbient - Default track ambient setting
 * @property {string | null} [overlayLabelOverride] - Optional override for overlay label
 * @property {number} [startTime] - Chapter start time (for API compatibility)
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @typedef {Object} YotoEditSettings
 * @property {string} autoOverlayLabels
 * @property {boolean} editKeys
 * @property {boolean} transcodeAudioUploads
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoMetadata
 * @property {YotoCategory} category - Content category
 * @property {Object} cover - Cover image
 * @property {string | null} cover.imageL - Large cover image URL
 * @property {YotoMedia} media - Media information
 * @property {string} [accent] - Accent (e.g., "British")
 * @property {boolean} [addToFamilyLibrary] - Whether to add to family library
 * @property {string} [author] - Author name
 * @property {string} [copyright] - Copyright information
 * @property {string} [description] - Content description
 * @property {string[]} [genre] - Genre tags (e.g., ["Adventure", "Fantasy"])
 * @property {YotoLanguage[]} [languages] - Language codes
 * @property {number} [maxAge] - Maximum recommended age
 * @property {number} [minAge] - Minimum recommended age
 * @property {string[]} [musicType] - Music types (e.g., ["Classical", "Instrumental"])
 * @property {string} [note] - Additional notes
 * @property {string} [order] - Order (e.g., "featured")
 * @property {string} [audioPreviewUrl] - Preview audio URL
 * @property {string} [readBy] - Narrator name
 * @property {boolean} [share] - Whether sharing is enabled
 * @property {YotoStatus} [status] - Content status
 * @property {string[]} [tags] - Content tags
 * @property {string} [feedUrl] - Podcast feed URL
 * @property {number} [numEpisodes] - Number of episodes (for podcasts)
 * @property {YotoPlaybackDirection} [playbackDirection] - Playback direction for podcasts
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoMedia
 * @property {number} duration
 * @property {number} fileSize
 * @property {boolean} hasStreams
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoContentConfig
 * @property {string} [autoadvance] - Auto-advance setting
 * @property {boolean} [onlineOnly] - Whether content requires online access
 * @property {YotoShuffle[]} [shuffle] - Shuffle configuration
 * @property {number} [trackNumberOverlayTimeout] - Track number overlay timeout in seconds
 * @property {number} [resumeTimeout] - Resume timeout in seconds
 * @property {boolean} [systemActivity] - System activity setting
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoShuffle
 * @property {number} end
 * @property {number} limit
 * @property {number} start
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoContentCover
 * @property {string | null} imageL
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoMyoEditSettings
 * @property {string} autoOverlayLabels
 * @property {boolean} editKeys
 * @property {YotoPodcastTrackDisplay} [podcastTrackDisplay]
 * @property {string} [podcastType]
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoPodcastTrackDisplay
 * @property {string} icon16x16
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoStatus
 * @property {YotoStatusName} name - Status name
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoSharing
 * @property {string} linkCreatedAt
 * @property {string} linkUrl
 * @property {number} shareCount
 * @property {number} shareLimit
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoClubAvailability
 * @property {string} store
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @typedef {Object} YotoContentResponse
 * @property {YotoCard} card
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoCard
 * @property {string} cardId - Unique card identifier
 * @property {YotoContent} content - Card content and chapters
 * @property {string} createdAt - Creation timestamp
 * @property {string} creatorEmail - Creator email address
 * @property {boolean} deleted - Whether card is deleted
 * @property {YotoMetadata} metadata - Card metadata
 * @property {number} shareLimit - Share limit count
 * @property {string} shareLinkCreatedAt - Share link creation timestamp
 * @property {string} slug - URL-friendly slug
 * @property {string} title - Card title
 * @property {string} updatedAt - Last update timestamp
 * @property {string} userId - Owner user ID
 * @property {string[]} [tags] - Top-level tags
 */

/**
 * @see https://yoto.dev/api/getcontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoContent
 * @property {string} activity - Activity type
 * @property {YotoChapter[]} chapters - Array of chapters
 * @property {YotoContentConfig} config - Content configuration
 * @property {YotoEditSettings} editSettings - Edit settings
 * @property {string} version - Content version
 * @property {YotoPlaybackType} [playbackType] - Playback type (linear or interactive)
 */

/**
 * Returns a piece of content from the Yoto API.
 * @see https://yoto.dev/api/getcontent/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.cardId   The card ID to fetch content for
 * @param  {string} [options.timezone]  Timezone identifier (e.g., 'Pacific/Auckland'). See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 * @param  {string} [options.signingType]  The type of playable signed URLs returned. Use with `playable`. Example: 's3'
 * @param  {boolean} [options.playable]  Return playable signed URLs
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoContentResponse>} The fetched content
 */
export async function getContent ({
  accessToken,
  userAgent,
  requestOptions,
  cardId,
  timezone,
  signingType,
  playable
}) {
  const requestUrl = new URL(`/content/${cardId}`, YOTO_API_URL)

  if (timezone) requestUrl.searchParams.set('timezone', timezone)
  if (signingType) requestUrl.searchParams.set('signingType', signingType)
  if (playable) requestUrl.searchParams.set('playable', playable.toString())

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response, { cardId })

  const responseBody = /** @type {YotoContentResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoMyoContentResponse
 * @property {YotoMyoCard[]} cards
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @typedef {Object} YotoMyoCard
 * @property {string} availability
 * @property {string} cardId
 * @property {YotoClubAvailability[]} [clubAvailability]
 * @property {YotoMyoContent} content
 * @property {string} createdAt
 * @property {boolean} deleted
 * @property {YotoMyoMetadata} metadata
 * @property {string} [shareLinkCreatedAt]
 * @property {string} [shareLinkUrl]
 * @property {YotoSharing} [sharing]
 * @property {string} slug
 * @property {string} [sortkey]
 * @property {string} title
 * @property {string} updatedAt
 * @property {string} userId
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoMyoContent
 * @property {string} activity - Activity type
 * @property {YotoContentConfig} config - Content configuration
 * @property {YotoContentCover} [cover] - Cover image
 * @property {YotoMyoEditSettings} editSettings - Edit settings
 * @property {boolean} [hidden] - Whether content is hidden
 * @property {boolean} [restricted] - Whether content is restricted
 * @property {string} version - Content version
 * @property {YotoPlaybackType} [playbackType] - Playback type (linear or interactive)
 */

/**
 * @see https://yoto.dev/api/getusersmyocontent/
 * @see https://yoto.dev/reference/card-content-schema/
 * @typedef {Object} YotoMyoMetadata
 * @property {YotoCategory} category - Content category
 * @property {YotoContentCover} [cover] - Cover image
 * @property {YotoMedia} media - Media information
 * @property {string} [accent] - Accent (e.g., "British")
 * @property {boolean} [addToFamilyLibrary] - Whether to add to family library
 * @property {string} [author] - Author name
 * @property {string} [copyright] - Copyright information
 * @property {string} [description] - Content description
 * @property {string[]} [genre] - Genre tags (e.g., ["Adventure", "Fantasy"])
 * @property {YotoLanguage[]} [languages] - Language codes
 * @property {number} [maxAge] - Maximum recommended age
 * @property {number} [minAge] - Minimum recommended age
 * @property {string[]} [musicType] - Music types (e.g., ["Classical", "Instrumental"])
 * @property {string} [note] - Additional notes
 * @property {any} [order] - Order
 * @property {string} [previewAudio] - Preview audio URL
 * @property {string} [audioPreviewUrl] - Audio preview URL (alternative field name)
 * @property {string} [readBy] - Narrator name
 * @property {boolean} [share] - Whether sharing is enabled
 * @property {YotoStatus} [status] - Content status
 * @property {string[]} [tags] - Content tags
 * @property {string | null} [feedUrl] - Podcast feed URL
 * @property {number} [numEpisodes] - Number of episodes (for podcasts)
 * @property {YotoPlaybackDirection} [playbackDirection] - Playback direction for podcasts
 * @property {boolean} [hidden] - Whether content is hidden
 * @property {any[]} [list] - List data
 */

/**
 * Returns the MYO cards belonging to the authenticated user.
 * @see https://yoto.dev/api/getusersmyocontent/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {boolean} [options.showDeleted=false]  Show owned cards that have been deleted
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoMyoContentResponse>} The user's MYO content
 */
export async function getUserMyoContent ({
  accessToken,
  userAgent,
  requestOptions,
  showDeleted = false
}) {
  const requestUrl = new URL('/content/mine', YOTO_API_URL)

  if (showDeleted) requestUrl.searchParams.set('showdeleted', showDeleted.toString())

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoMyoContentResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoCreateOrUpdateContentRequest
 * @property {string} [cardId] - Card ID for updating existing content (omit for creating new)
 * @property {string} title - Card title
 * @property {YotoContentInput} content - Content configuration
 * @property {YotoMetadataInput} [metadata] - Card metadata
 */

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoContentInput
 * @property {YotoChapter[]} [chapters] - Array of chapters
 * @property {YotoContentConfig} [config] - Content configuration
 * @property {string} [playbackType] - Playback type (e.g., 'linear')
 */

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoMetadataInput
 * @property {string} [description] - Content description
 * @property {string} [title] - Metadata title
 */

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoCreateOrUpdateContentResponse
 * @property {YotoCreatedCard} card
 */

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoCreatedCard
 * @property {string} _id - MongoDB document ID
 * @property {string} cardId - Card ID
 * @property {YotoCreatedContent} content
 * @property {string} createdAt
 * @property {Object} metadata
 * @property {string} title
 * @property {string} updatedAt
 * @property {string} userId
 */

/**
 * @see https://yoto.dev/api/createorupdatecontent/
 * @typedef {Object} YotoCreatedContent
 * @property {YotoChapter[]} chapters
 * @property {YotoContentConfig} config
 * @property {string} playbackType
 */

/**
 * Create new content or update existing content.
 * @see https://yoto.dev/api/createorupdatecontent/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {YotoCreateOrUpdateContentRequest} options.content  The content to create or update
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoCreateOrUpdateContentResponse>} The created or updated content
 */
export async function createOrUpdateContent ({
  accessToken,
  userAgent,
  requestOptions,
  content
}) {
  const requestUrl = new URL('/content', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers: {
      ...defaultAuthHeaders({ accessToken, userAgent }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(content)
  }, requestOptions))

  await handleBadResponse(response, { cardId: content.cardId })

  const responseBody = /** @type {YotoCreateOrUpdateContentResponse} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/deletecontent/
 * @typedef {Object} YotoDeleteContentResponse
 * @property {string} status - Status of the delete operation (e.g., 'ok')
 */

/**
 * Delete a piece of content.
 * @see https://yoto.dev/api/deletecontent/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.cardId   The card ID to delete
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeleteContentResponse>} The delete response
 */
export async function deleteContent ({
  accessToken,
  userAgent,
  requestOptions,
  cardId
}) {
  const requestUrl = new URL(`/content/${cardId}`, YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'DELETE',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response, { cardId })

  const responseBody = /** @type {YotoDeleteContentResponse} */ (await response.body.json())
  return responseBody
}
