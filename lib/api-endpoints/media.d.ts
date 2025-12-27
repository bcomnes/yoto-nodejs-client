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
export function getAudioUploadUrl({ accessToken, userAgent, sha256, filename, requestOptions }: {
    accessToken: string;
    sha256: string;
    filename?: string | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoAudioUploadUrlResponse>;
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
export function uploadCoverImage({ accessToken, userAgent, imageData, imageUrl, autoConvert, coverType, filename, requestOptions }: {
    accessToken: string;
    imageData?: string | Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike> | undefined;
    imageUrl?: string | undefined;
    autoConvert?: boolean | undefined;
    coverType?: YotoCoverType | undefined;
    filename?: string | undefined;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUploadCoverImageResponse>;
export type YotoAudioUpload = {
    /**
     * - Upload identifier
     */
    uploadId: string;
    /**
     * - Signed upload URL, or null if file already exists
     */
    uploadUrl: string | null;
};
export type YotoAudioUploadUrlResponse = {
    upload: YotoAudioUpload;
};
export type YotoCoverImage = {
    /**
     * - Media identifier
     */
    mediaId: string;
    /**
     * - URL to access the uploaded cover image
     */
    mediaUrl: string;
};
export type YotoUploadCoverImageResponse = {
    coverImage: YotoCoverImage;
};
export type YotoCoverType = "default" | "activities" | "music" | "myo" | "podcast" | "radio" | "sfx" | "stories";
//# sourceMappingURL=media.d.ts.map