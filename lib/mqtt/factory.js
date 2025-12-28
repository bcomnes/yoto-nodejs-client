/**
 * MQTT Client Factory for Yoto Players
 *
 * Factory function to create properly configured MQTT clients for Yoto devices
 * @see https://yoto.dev/players-mqtt/
 */

/**
 * @import { IClientOptions } from 'mqtt'
 * @import { RefreshableToken } from '../token.js'
 */

// ============================================================================
// MQTT Factory: Create properly configured MQTT clients for Yoto devices
// ============================================================================

/**
 * MQTT.js client options that can be passed to createYotoMqttClient
 * @typedef {Partial<IClientOptions>} MqttClientOptions
 */

/**
 * @typedef {Object} YotoMqttOptions
 * @property {string} deviceId - Device ID to connect to
 * @property {RefreshableToken} token - RefreshableToken instance used to supply the current JWT. Enables auto-updating auth on reconnect via transformWsUrl.
 * @property {string} [sessionId=randomUUID()] - Stable unique session ID suffix used to avoid collisions across multiple clients/processes. Used to build the MQTT clientId: DASH${deviceId}${sessionId} (non-alphanumeric characters are stripped). (MQTT calls this clientId, but we call it sessionId to not confuse it with the oauth clientId)
 * @property {string} [clientIdPrefix='DASH'] - Prefix for MQTT client ID (default: 'DASH')
 * @property {string} [brokerUrl='wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com'] - MQTT broker URL
 * @property {number} [port=443] - MQTT broker port
 * @property {boolean} [autoSubscribe=true] - Auto-subscribe to device topics on connect
 * @property {MqttClientOptions} [mqttOptions] - Additional MQTT.js client options (defaults: reconnectPeriod=5000, reconnectOnConnackError=true, keepalive=300, clean=false; cannot override: clientId, username, password, protocol, ALPNProtocols; transformWsUrl is wrapped to keep auth current)
 */

import mqtt from 'mqtt'
import { YotoMqttClient } from './client.js'
import {
  MQTT_BROKER_URL,
  MQTT_AUTH_NAME,
  MQTT_PORT,
  MQTT_PROTOCOL,
  MQTT_KEEPALIVE,
  MQTT_ALPN_PROTOCOLS
} from './topics.js'
import { randomUUID } from 'node:crypto'

/**
 * Create a configured MQTT client for a Yoto device
 * @param {YotoMqttOptions} options - MQTT connection options
 * @returns {YotoMqttClient} Configured Yoto MQTT client
 * @throws {Error} If required options are missing
 *
 * @example
 * ```javascript
 * import { createYotoMqttClient } from 'yoto-nodejs-client/lib/mqtt'
 *
 * const client = createYotoMqttClient({
 *   deviceId: 'abc123',
 *   token,
 *   clientId: 'my-unique-client-id'
 * })
 *
 * client.on('events', (message) => {
 *   console.log('Playing:', message.trackTitle)
 * })
 *
 * await client.connect()
 * ```
 *
 * @example
 * ```javascript
 * // Disable automatic reconnection
 * const client = createYotoMqttClient({
 *   deviceId: 'abc123',
 *   token,
 *   clientId: 'my-unique-client-id',
 *   mqttOptions: {
 *     reconnectPeriod: 0,     // Disable auto-reconnect (default is 5000ms)
 *     connectTimeout: 30000   // 30 second connection timeout
 *   }
 * })
 * ```
 */
export function createYotoMqttClient (options) {
  // Validate required options
  if (!options.deviceId) {
    throw new Error('deviceId is required')
  }

  if (!options.token) {
    throw new Error('token is required')
  }

  if (!options.sessionId) {
    throw new Error('clientId is required')
  }

  // Extract options with defaults
  const {
    deviceId,
    token,
    sessionId = randomUUID(),
    clientIdPrefix = 'DASH',
    brokerUrl = MQTT_BROKER_URL,
    port = MQTT_PORT,
    autoSubscribe = true,
    mqttOptions: additionalMqttOptions = {}
  } = options

  // Build MQTT client ID
  const mqttSessionId = (`${clientIdPrefix}${deviceId}${sessionId}`).replace(/[^a-zA-Z0-9]/g, '')

  // Build username with authorizer
  const username = `${deviceId}?x-amz-customauthorizer-name=${MQTT_AUTH_NAME}`

  const userTransformWsUrl = additionalMqttOptions.transformWsUrl

  /** @type {IClientOptions['transformWsUrl']} */
  const transformWsUrl = (url, mqttOptions, client) => {
    // Ensure the CONNECT auth uses the latest access token for every websocket (re)connect.
    const latestAccessToken = token.accessToken
    client.options.password = latestAccessToken

    let nextUrl = url
    if (typeof userTransformWsUrl === 'function') {
      nextUrl = userTransformWsUrl(url, mqttOptions, client)
    }

    // Re-apply in case user hook mutated it.
    client.options.password = latestAccessToken

    return nextUrl
  }

  // Create MQTT connection options
  // Merge additional options first, then override with required Yoto settings
  /** @type {IClientOptions} */
  const mqttOptions = {
    // Defaults (can be overridden by additionalMqttOptions)
    reconnectPeriod: 5000, // Default: auto-reconnect after 5 seconds
    reconnectOnConnackError: true, // Default: keep reconnecting after CONNACK auth errors (token refresh may fix it)
    keepalive: MQTT_KEEPALIVE, // Default: 300 seconds (5 minutes)
    clean: false, // Default: persistent session for stable subscriptions on the broker
    ...additionalMqttOptions, // Allow overriding defaults
    // Required Yoto-specific settings (cannot be overridden)
    clientId: mqttSessionId,
    username,
    password: token.accessToken,
    port,
    protocol: MQTT_PROTOCOL,
    ALPNProtocols: MQTT_ALPN_PROTOCOLS,
    transformWsUrl
  }

  // Create underlying MQTT client (not connected yet)
  const mqttClient = mqtt.connect(brokerUrl, mqttOptions)

  // Create and return Yoto MQTT client wrapper
  return new YotoMqttClient(mqttClient, deviceId, {
    autoSubscribe
  })
}
