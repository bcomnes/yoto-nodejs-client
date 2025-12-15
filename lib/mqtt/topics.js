/**
 * MQTT Topics for Yoto Players
 *
 * Topic builders and constants for Yoto MQTT communication
 * @see https://yoto.dev/players-mqtt/
 */

// ============================================================================
// MQTT Topics: Topic builders and constants
// ============================================================================

/**
 * MQTT topic type for subscriptions
 * @typedef {'events' | 'status' | 'status-legacy' | 'response'} YotoMqttTopicType
 */

/**
 * MQTT broker URL for Yoto devices
 */
export const MQTT_BROKER_URL = 'wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com'

/**
 * MQTT authorizer name for Yoto authentication
 */
export const MQTT_AUTH_NAME = 'PublicJWTAuthorizer'

/**
 * MQTT connection port
 */
export const MQTT_PORT = 443

/**
 * MQTT protocol
 */
export const MQTT_PROTOCOL = 'wss'

/**
 * MQTT keepalive interval in seconds
 */
export const MQTT_KEEPALIVE = 300

/**
 * ALPN protocols for AWS IoT
 */
export const MQTT_ALPN_PROTOCOLS = ['x-amzn-mqtt-ca']

/**
 * Get the events topics for a device
 *
 * NOTE: Old undocumented format device/{id}/events exists but returns different low-level
 * hardware data. Do not use. Only the documented /data/ path is supported.
 *
 * @param {string} deviceId - Device ID
 * @returns {string[]} Events topics
 */
export function getEventsTopic (deviceId) {
  return [
    // `device/${deviceId}/events`,           // OLD UNDOCUMENTED FORMAT - DO NOT USE (low-level hardware data, different schema)
    `device/${deviceId}/data/events`       // Documented format - use this
  ]
}

/**
 * Get the status topics for a device
 *
 * Subscribes to BOTH documented and legacy status topics:
 * - device/{id}/data/status: Documented format - responds to requestStatus(), auto-publishes every 5 min
 * - device/{id}/status: Legacy format - does NOT respond to requests, emits on lifecycle events + every 5 min
 *
 * The legacy topic is the ONLY source for:
 * - shutDown field: 'nA' = device running, any other value = device shutting down/shut down
 * - Startup detection: shutDown='nA' + low upTime values + utcTime: 0 after power on
 * - Full hardware diagnostics: battery voltage, memory stats, temperatures
 *
 * Key behavior differences:
 * - Documented topic: Responds immediately to requestStatus() command
 * - Legacy topic: Emits real-time on shutdown/startup events, plus periodic updates every 5 minutes
 * - Legacy topic does NOT respond to requestStatus() - it's passive/event-driven only
 *
 * Both topics are necessary - the documented /data/ path does not include lifecycle events.
 *
 * @param {string} deviceId - Device ID
 * @returns {string[]} Status topics (both documented and legacy)
 */
export function getStatusTopic (deviceId) {
  return [
    `device/${deviceId}/data/status`,      // Documented format - regular status updates
    `device/${deviceId}/status`            // Legacy format - REQUIRED for lifecycle events (shutDown, startup)
  ]
}

/**
 * Get the response topic for a device (subscribe)
 * @param {string} deviceId - Device ID
 * @returns {string} Response topic
 */
export function getResponseTopic (deviceId) {
  return `device/${deviceId}/response`
}

/**
 * Get all subscription topics for a device
 *
 * Subscribes to documented formats PLUS legacy status topic:
 * - device/{id}/data/events - Event messages (documented)
 * - device/{id}/data/status - Status messages (documented)
 * - device/{id}/status - Legacy status (REQUIRED for shutdown/startup lifecycle events)
 * - device/{id}/response - Command responses (documented)
 *
 * The legacy status topic is necessary because the documented /data/ topics do not
 * include device lifecycle events (shutdown, startup) which are critical for proper
 * device state management.
 *
 * @param {string} deviceId - Device ID
 * @returns {string[]} Array of topics to subscribe to
 */
export function getSubscriptionTopics (deviceId) {
  return [
    ...getEventsTopic(deviceId),           // Events topic (documented format)
    ...getStatusTopic(deviceId),           // Status topics (documented + legacy for lifecycle)
    getResponseTopic(deviceId)             // Response topic
  ]
}

/**
 * Get a command topic for a device (publish)
 * @param {string} deviceId - Device ID
 * @param {string} resource - Command resource (e.g., 'volume', 'ambients', 'card')
 * @param {string} [action] - Command action (e.g., 'set', 'start', 'stop')
 * @returns {string} Command topic
 */
export function getCommandTopic (deviceId, resource, action) {
  const base = `device/${deviceId}/command/${resource}`
  return action ? `${base}/${action}` : base
}

/**
 * Parse a topic string to extract device ID and message type
 *
 * Distinguishes between documented and legacy status topics:
 * - device/{id}/data/status -> messageType: 'status' (documented)
 * - device/{id}/status -> messageType: 'status-legacy' (for lifecycle events)
 *
 * @param {string} topic - Full MQTT topic string
 * @returns {{ deviceId: string, messageType: YotoMqttTopicType | 'unknown' }} Parsed topic info
 */
export function parseTopic (topic) {
  const parts = topic.split('/')

  if (parts.length < 3 || parts[0] !== 'device') {
    return { deviceId: '', messageType: 'unknown' }
  }

  const deviceId = parts[1] || ''

  // Handle both documented format (device/{id}/data/status) and legacy format (device/{id}/status)
  let messageType = parts[2]

  if (messageType === 'data' && parts.length >= 4) {
    // Documented format: device/{id}/data/{type}
    messageType = parts[3] // Get the actual message type after /data/
  } else if (messageType === 'status') {
    // Legacy format: device/{id}/status
    // Return 'status-legacy' to distinguish from documented status
    return { deviceId, messageType: 'status-legacy' }
  }

  // Validate message type
  if (messageType !== 'events' && messageType !== 'status' && messageType !== 'response') {
    return { deviceId, messageType: 'unknown' }
  }

  return { deviceId, messageType: /** @type {YotoMqttTopicType} */ (messageType) }
}

// Command topic builders for specific commands

/**
 * Get the events request command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Events request topic
 */
export function getEventsRequestTopic (deviceId) {
  return getCommandTopic(deviceId, 'events', 'request')
}

/**
 * Get the status request command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Status request topic
 */
export function getStatusRequestTopic (deviceId) {
  return getCommandTopic(deviceId, 'status', 'request')
}

/**
 * Get the volume set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Volume set topic
 */
export function getVolumeSetTopic (deviceId) {
  return getCommandTopic(deviceId, 'volume', 'set')
}

/**
 * Get the ambients set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Ambients set topic
 */
export function getAmbientsSetTopic (deviceId) {
  return getCommandTopic(deviceId, 'ambients', 'set')
}

/**
 * Get the sleep timer set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Sleep timer set topic
 */
export function getSleepTimerSetTopic (deviceId) {
  return getCommandTopic(deviceId, 'sleep-timer', 'set')
}

/**
 * Get the reboot command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Reboot topic
 */
export function getRebootTopic (deviceId) {
  return getCommandTopic(deviceId, 'reboot')
}

/**
 * Get the card start command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card start topic
 */
export function getCardStartTopic (deviceId) {
  return getCommandTopic(deviceId, 'card', 'start')
}

/**
 * Get the card stop command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card stop topic
 */
export function getCardStopTopic (deviceId) {
  return getCommandTopic(deviceId, 'card', 'stop')
}

/**
 * Get the card pause command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card pause topic
 */
export function getCardPauseTopic (deviceId) {
  return getCommandTopic(deviceId, 'card', 'pause')
}

/**
 * Get the card resume command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card resume topic
 */
export function getCardResumeTopic (deviceId) {
  return getCommandTopic(deviceId, 'card', 'resume')
}

/**
 * Get the bluetooth on command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth on topic
 */
export function getBluetoothOnTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'on')
}

/**
 * Get the bluetooth off command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth off topic
 */
export function getBluetoothOffTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'off')
}

/**
 * Get the bluetooth delete bonds command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth delete bonds topic
 */
export function getBluetoothDeleteBondsTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'delete-bonds')
}

/**
 * Get the bluetooth connect command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth connect topic
 */
export function getBluetoothConnectTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'connect')
}

/**
 * Get the bluetooth disconnect command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth disconnect topic
 */
export function getBluetoothDisconnectTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'disconnect')
}

/**
 * Get the bluetooth state command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth state topic
 */
export function getBluetoothStateTopic (deviceId) {
  return getCommandTopic(deviceId, 'bluetooth', 'state')
}

/**
 * Get the display preview command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Display preview topic
 */
export function getDisplayPreviewTopic (deviceId) {
  return getCommandTopic(deviceId, 'display', 'preview')
}
