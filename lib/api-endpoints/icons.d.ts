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
export function getPublicIcons({ accessToken, userAgent, requestOptions }: {
    accessToken: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoPublicIconsResponse>;
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
export function getUserIcons({ accessToken, userAgent, requestOptions }: {
    accessToken: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUserIconsResponse>;
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
export function uploadIcon({ accessToken, userAgent, imageData, autoConvert, filename, requestOptions }: {
    accessToken: string;
    imageData: Buffer;
    autoConvert?: boolean | undefined;
    filename?: string | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUploadIconResponse>;
export type YotoPublicIconsResponse = {
    /**
     * - Array of public display icons
     */
    displayIcons: YotoPublicIcon[];
};
export type YotoPublicIcon = {
    /**
     * - Unique identifier for the icon
     */
    displayIconId: string;
    /**
     * - Unique identifier for the underlying icon file
     */
    mediaId: string;
    /**
     * - ID of the user who uploaded this icon (always "yoto" for public icons)
     */
    userId: string;
    /**
     * - ISO 8601 timestamp when icon record was created
     */
    createdAt: string;
    /**
     * - Title of the display icon
     */
    title: string;
    /**
     * - URL of the display icon
     */
    url: string;
    /**
     * - Indicates if the icon is public (always true for public icons)
     */
    public: boolean;
    /**
     * - Indicates if this is a new icon (may not always be present)
     */
    new?: boolean;
    /**
     * - Public tags associated with the display icon
     */
    publicTags: string[];
};
export type YotoUserIconsResponse = {
    /**
     * - Array of user's custom display icons
     */
    displayIcons: YotoUserIcon[];
};
export type YotoUserIcon = {
    /**
     * - Unique identifier for the icon
     */
    displayIconId: string;
    /**
     * - Unique identifier for the underlying icon file
     */
    mediaId: string;
    /**
     * - ID of the user who uploaded this icon
     */
    userId: string;
    /**
     * - ISO 8601 timestamp when icon record was created
     */
    createdAt: string;
    /**
     * - URL of the display icon
     */
    url: string;
    /**
     * - Indicates if the icon is public (always false for user icons)
     */
    public: boolean;
};
export type YotoUploadIconResponse = {
    /**
     * - The uploaded or existing display icon
     */
    displayIcon: YotoDisplayIcon;
};
export type YotoDisplayIcon = {
    /**
     * - Unique identifier for the icon
     */
    displayIconId: string;
    /**
     * - Unique identifier for the underlying icon file
     */
    mediaId: string;
    /**
     * - ID of the user who uploaded this icon
     */
    userId: string;
    /**
     * - URL of the display icon, or empty object {} for duplicates
     */
    url: string | object;
    /**
     * - True if this is a new upload, undefined for duplicates
     */
    new?: boolean;
    /**
     * - MongoDB ID (present for duplicate uploads)
     */
    _id?: string;
    /**
     * - ISO 8601 timestamp (present for duplicate uploads)
     */
    createdAt?: string;
};
//# sourceMappingURL=icons.d.ts.map