/**
 * @import { RequestOptions } from './helpers.js'
 */
import { request } from 'undici'
import { defaultAuthHeaders, handleBadResponse, mergeRequestOptions } from './helpers.js'
import { YOTO_API_URL } from './constants.js'

// ============================================================================
// Family Library Groups: Endpoints for managing family library card groups
// ============================================================================

/**
 * @see https://yoto.dev/api/getgroups/
 * @typedef {Object} YotoGroupsResponse
 * @property {YotoGroup[]} groups - Array of family library groups
 */

/**
 * @see https://yoto.dev/api/getgroups/
 * @typedef {Object} YotoGroup
 * @property {string} id - Group identifier
 * @property {string} name - Group name (e.g., "My Favourites")
 * @property {string} familyId - Associated family ID
 * @property {string} imageId - ID for the group image (can be uploaded family image hash or preset like "fp-cards")
 * @property {string} imageUrl - CDN URL to the group image
 * @property {YotoGroupItem[]} items - Array of content items in the group
 * @property {any[]} cards - Array of card objects
 * @property {string} createdAt - ISO 8601 timestamp when group was created
 * @property {string} lastModifiedAt - ISO 8601 timestamp when group was last updated
 */

/**
 * @see https://yoto.dev/api/getgroups/
 * @typedef {Object} YotoGroupItem
 * @property {string} contentId - ID of the card content
 * @property {string} addedAt - ISO 8601 timestamp when item was added to group
 */

/**
 * Retrieves all family library groups for the authenticated user's family.
 * Returns an empty array if no groups exist.
 * @see https://yoto.dev/api/getgroups/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoGroup[]>} Array of family library groups
 * @example
 * import { getGroups } from 'yoto-nodejs-client'
 *
 * const groups = await getGroups({
 *   accessToken
 * })
 *
 * console.log('Groups:', groups.length)
 * groups.forEach(group => {
 *   console.log(`${group.name}: ${group.items.length} items`)
 * })
 */
export async function getGroups ({
  accessToken,
  userAgent,
  requestOptions
}) {
  const requestUrl = new URL('/card/family/library/groups', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoGroup[]} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/createagroup/
 * @typedef {Object} YotoCreateGroupRequest
 * @property {string} name - Group name (max 100 characters, UTF-8 supported)
 * @property {string} imageId - Image ID (preset like "fp-cards" or uploaded image hash)
 * @property {YotoGroupItemInput[]} items - Array of content items (can be empty, order preserved)
 */

/**
 * @see https://yoto.dev/api/createagroup/
 * @typedef {Object} YotoGroupItemInput
 * @property {string} contentId - ID of the card content to add to group
 */

/**
 * Creates a new group in the family library.
 * Max 20 groups per family. ContentIds must be in family's library (invalid ones filtered out).
 * @see https://yoto.dev/api/createagroup/
 * @param  {object} options
 * @param  {string} options.token    The API token to request with
 * @param  {YotoCreateGroupRequest} options.group The group data to create
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoGroup>} The created group with populated cards array
 * @example
 * import { createGroup } from 'yoto-nodejs-client'
 *
 * const group = await createGroup({
 *   token: accessToken,
 *   group: {
 *     name: 'My Favourites',
 *     imageId: 'fp-cards',
 *     items: [
 *       { contentId: '37KwQ' }
 *     ]
 *   }
 * })
 */
export async function createGroup ({
  token,
  userAgent,
  group,
  requestOptions
}) {
  const requestUrl = new URL('/card/family/library/groups', YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'POST',
    headers: {
      ...defaultAuthHeaders({ accessToken: token, userAgent }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(group)
  }, requestOptions))

  await handleBadResponse(response)

  const responseBody = /** @type {YotoGroup} */ (await response.body.json())
  return responseBody
}

/**
 * Retrieves a specific group by ID.
 * Returns 404 if group doesn't exist or belongs to another family.
 * @see https://yoto.dev/api/getagroup/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.groupId  The group ID to retrieve
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoGroup>} The requested group with populated cards array
 */
export async function getGroup ({
  accessToken,
  userAgent,
  groupId,
  requestOptions
}) {
  const requestUrl = new URL(`/card/family/library/groups/${groupId}`, YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'GET',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response, { groupId })

  const responseBody = /** @type {YotoGroup} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/updateagroup/
 * @typedef {Object} YotoUpdateGroupRequest
 * @property {string} name - Group name (max 100 characters, UTF-8 supported)
 * @property {string} imageId - Image ID (preset like "fp-cards" or uploaded image hash)
 * @property {YotoGroupItemInput[]} items - Array of content items (replaces entire array)
 */

/**
 * Updates an existing group.
 * Can only update groups owned by family. Returns 404 if doesn't exist or owned by another family.
 * @see https://yoto.dev/api/updateagroup/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.groupId  The group ID to update
 * @param  {YotoUpdateGroupRequest} options.group The updated group data
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoGroup>} The updated group with populated cards array
 */
export async function updateGroup ({
  accessToken,
  userAgent,
  groupId,
  group,
  requestOptions
}) {
  const requestUrl = new URL(`/card/family/library/groups/${groupId}`, YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'PUT',
    headers: {
      ...defaultAuthHeaders({ accessToken, userAgent }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(group)
  }, requestOptions))

  await handleBadResponse(response, { groupId })

  const responseBody = /** @type {YotoGroup} */ (await response.body.json())
  return responseBody
}

/**
 * @see https://yoto.dev/api/deleteagroup/
 * @typedef {Object} YotoDeleteGroupResponse
 * @property {string} id - The ID of the deleted group
 */

/**
 * Deletes a group permanently (hard delete, cannot be recovered).
 * Content remains in family library. Returns 404 if doesn't exist or owned by another family.
 * @see https://yoto.dev/api/deleteagroup/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.groupId  The group ID to delete
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeleteGroupResponse>} Confirmation with deleted group ID
 */
export async function deleteGroup ({
  accessToken,
  userAgent,
  groupId,
  requestOptions
}) {
  const requestUrl = new URL(`/card/family/library/groups/${groupId}`, YOTO_API_URL)

  const response = await request(requestUrl, mergeRequestOptions({
    method: 'DELETE',
    headers: defaultAuthHeaders({ accessToken, userAgent })
  }, requestOptions))

  await handleBadResponse(response, { groupId })

  const responseBody = /** @type {YotoDeleteGroupResponse} */ (await response.body.json())
  return responseBody
}
