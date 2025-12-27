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
export function getFamilyImages({ accessToken, userAgent, requestOptions }: {
    accessToken: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoFamilyImagesResponse>;
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
export function getAFamilyImage({ accessToken, userAgent, imageId, size, requestOptions }: {
    accessToken: string;
    imageId: string;
    size: "640x480" | "320x320";
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoFamilyImageResponse>;
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
export function uploadAFamilyImage({ accessToken, userAgent, imageData, requestOptions }: {
    accessToken: string;
    imageData: Buffer;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUploadFamilyImageResponse>;
export type YotoFamilyImagesResponse = {
    images: YotoFamilyImage[];
};
export type YotoFamilyImage = {
    /**
     * - The unique identifier for the family image (hash)
     */
    imageId: string;
    /**
     * - Optional name of the family image
     */
    name?: string;
};
export type YotoFamilyImageResponse = {
    /**
     * - The signed URL to the family image (expires after 7 days)
     */
    imageUrl: string;
};
export type YotoUploadFamilyImageResponse = {
    /**
     * - The SHA256 checksum of the uploaded image
     */
    imageId: string;
    /**
     * - URL to the 'get a family image' endpoint (requires width/height params)
     */
    url: string;
};
//# sourceMappingURL=family.d.ts.map