/**
 * Default OAuth client ID for testing and development
 * This is a public client ID for the app "yoto-nodejs-client".
 * Generate a new one at https://dashboard.yoto.dev or use the default.
 * @constant {string}
 */
export const DEFAULT_CLIENT_ID = 'ix91Qy0B4uA8187JhI0tQbQQ5I5nUKYh'

/**
 * Yoto API base URL
 * @constant {string}
 */
export const YOTO_API_URL = 'https://api.yotoplay.com'

/**
 * Yoto login/authentication base URL
 * @constant {string}
 */
export const YOTO_LOGIN_URL = 'https://login.yotoplay.com'

/**
 * Default OAuth audience for Yoto API
 * @constant {string}
 */
export const DEFAULT_AUDIENCE = YOTO_API_URL

/**
 * Default OAuth scope for Yoto API
 * Includes OpenID Connect, profile information, and offline access (refresh tokens)
 * @constant {string}
 */
export const DEFAULT_SCOPE = 'openid profile offline_access'

/**
 * OAuth device code grant type
 * @constant {string}
 */
export const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'
