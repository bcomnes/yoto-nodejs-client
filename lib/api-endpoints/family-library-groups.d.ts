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
export function getGroups({ accessToken, userAgent, requestOptions }: {
    accessToken: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoGroup[]>;
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
export function createGroup({ token, userAgent, group, requestOptions }: {
    token: string;
    group: YotoCreateGroupRequest;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoGroup>;
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
export function getGroup({ accessToken, userAgent, groupId, requestOptions }: {
    accessToken: string;
    groupId: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoGroup>;
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
export function updateGroup({ accessToken, userAgent, groupId, group, requestOptions }: {
    accessToken: string;
    groupId: string;
    group: YotoUpdateGroupRequest;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoGroup>;
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
export function deleteGroup({ accessToken, userAgent, groupId, requestOptions }: {
    accessToken: string;
    groupId: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDeleteGroupResponse>;
export type YotoGroupsResponse = {
    /**
     * - Array of family library groups
     */
    groups: YotoGroup[];
};
export type YotoGroup = {
    /**
     * - Group identifier
     */
    id: string;
    /**
     * - Group name (e.g., "My Favourites")
     */
    name: string;
    /**
     * - Associated family ID
     */
    familyId: string;
    /**
     * - ID for the group image (can be uploaded family image hash or preset like "fp-cards")
     */
    imageId: string;
    /**
     * - CDN URL to the group image
     */
    imageUrl: string;
    /**
     * - Array of content items in the group
     */
    items: YotoGroupItem[];
    /**
     * - Array of card objects
     */
    cards: any[];
    /**
     * - ISO 8601 timestamp when group was created
     */
    createdAt: string;
    /**
     * - ISO 8601 timestamp when group was last updated
     */
    lastModifiedAt: string;
};
export type YotoGroupItem = {
    /**
     * - ID of the card content
     */
    contentId: string;
    /**
     * - ISO 8601 timestamp when item was added to group
     */
    addedAt: string;
};
export type YotoCreateGroupRequest = {
    /**
     * - Group name (max 100 characters, UTF-8 supported)
     */
    name: string;
    /**
     * - Image ID (preset like "fp-cards" or uploaded image hash)
     */
    imageId: string;
    /**
     * - Array of content items (can be empty, order preserved)
     */
    items: YotoGroupItemInput[];
};
export type YotoGroupItemInput = {
    /**
     * - ID of the card content to add to group
     */
    contentId: string;
};
export type YotoUpdateGroupRequest = {
    /**
     * - Group name (max 100 characters, UTF-8 supported)
     */
    name: string;
    /**
     * - Image ID (preset like "fp-cards" or uploaded image hash)
     */
    imageId: string;
    /**
     * - Array of content items (replaces entire array)
     */
    items: YotoGroupItemInput[];
};
export type YotoDeleteGroupResponse = {
    /**
     * - The ID of the deleted group
     */
    id: string;
};
//# sourceMappingURL=family-library-groups.d.ts.map