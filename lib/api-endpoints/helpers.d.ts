/**
 * Request options derived from undici.request
 * @typedef {NonNullable<Parameters<typeof request>[1]>} RequestOptions
 */
/**
 * @param {object} [options]
 * @param {string} [options.userAgent] - Optional user agent string to prepend to library user agent
 * @param {RequestOptions} [options.requestOptions] - Additional undici request options
 */
export function defaultHeaders(options?: {
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: Dispatcher;
    } & Omit<Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): {
    Accept: string;
    'User-Agent': string;
};
/**
 * @param  {object} params
 * @param  {string} params.accessToken
 * @param {string} [params.userAgent] - Optional user agent string to prepend to library user agent
 */
export function defaultAuthHeaders({ accessToken: token, userAgent }: {
    accessToken: string;
    userAgent?: string | undefined;
}): {
    Authorization: string;
    Accept: string;
    'User-Agent': string;
};
/**
 * Merge undici request options with defaults
 * Properly merges headers by supplementing rather than overriding
 * Only supports object headers (not arrays)
 * @param {RequestOptions} baseOptions - Base request options with headers
 * @param {RequestOptions} [requestOptions] - Additional request options to merge
 * @returns {object} Merged options
 */
export function mergeRequestOptions(baseOptions: RequestOptions, requestOptions?: RequestOptions): object;
/**
 * @param  {Dispatcher.ResponseData} response
 * @param  {any} [extra]
 */
export function handleBadResponse(response: Dispatcher.ResponseData, extra?: any): Promise<void>;
export class YotoAPIError extends Error {
    /**
     * @param  {Dispatcher.ResponseData} response A undici Response
     * @param  {string | object} body response body
     * @param  {any} [extra] any extra info to attach to the error
     */
    constructor(response: Dispatcher.ResponseData, body: string | object, extra?: any);
    /** @type { number } */ statusCode: number;
    /** @type {string | object } */ body: string | object;
    /** @type {any} */ extra: any;
}
/**
 * Request options derived from undici.request
 */
export type RequestOptions = NonNullable<Parameters<typeof request>[1]>;
import type { Dispatcher } from 'undici';
import type { request } from 'undici';
//# sourceMappingURL=helpers.d.ts.map