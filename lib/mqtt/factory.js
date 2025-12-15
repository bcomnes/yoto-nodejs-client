/**
 * MQTT Client Factory for Yoto Players
 *
 * Factory function to create properly configured MQTT clients for Yoto devices
 * @see https://yoto.dev/players-mqtt/
 */

/**
 * @import { IClientOptions } from 'mqtt'
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
 * @property {string} accessToken - JWT access token for authentication
 * @property {string} [clientIdPrefix='DASH'] - Prefix for MQTT client ID (default: 'DASH')
 * @property {string} [brokerUrl='wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com'] - MQTT broker URL
 * @property {number} [port=443] - MQTT broker port
 * @property {boolean} [autoSubscribe=true] - Auto-subscribe to device topics on connect
 * @property {MqttClientOptions} [mqttOptions] - Additional MQTT.js client options (defaults: reconnectPeriod=5000, keepalive=300; cannot override: clientId, username, password, protocol, ALPNProtocols)
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
 *   accessToken: 'eyJhbGc...'
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
 *   accessToken: 'token',
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

  if (!options.accessToken) {
    throw new Error('accessToken is required')
  }

  // Extract options with defaults
  const {
    deviceId,
    accessToken,
    clientIdPrefix = 'DASH',
    brokerUrl = MQTT_BROKER_URL,
    port = MQTT_PORT,
    autoSubscribe = true,
    mqttOptions: additionalMqttOptions = {}
  } = options

  // Build MQTT client ID
  const clientId = `${clientIdPrefix}${deviceId}`

  // Build username with authorizer
  const username = `${deviceId}?x-amz-customauthorizer-name=${MQTT_AUTH_NAME}`

  // Create MQTT connection options
  // Merge additional options first, then override with required Yoto settings
  /** @type {IClientOptions} */
  const mqttOptions = {
    // Defaults (can be overridden by additionalMqttOptions)
    reconnectPeriod: 5000, // Default: auto-reconnect after 5 seconds
    keepalive: MQTT_KEEPALIVE, // Default: 300 seconds (5 minutes)
    ...additionalMqttOptions, // Allow overriding defaults
    // Required Yoto-specific settings (cannot be overridden)
    clientId,
    username,
    password: accessToken,
    port,
    protocol: MQTT_PROTOCOL,
    ALPNProtocols: MQTT_ALPN_PROTOCOLS
  }

  // Create underlying MQTT client (not connected yet)
  const mqttClient = mqtt.connect(brokerUrl, mqttOptions)

  // Create and return Yoto MQTT client wrapper
  return new YotoMqttClient(mqttClient, deviceId, {
    autoSubscribe
  })
}
