/**
 * Get the events topics for a device
 *
 * NOTE: Old undocumented format device/{id}/events exists but returns different low-level
 * hardware data. Do not use. Only the documented /data/ path is supported.
 *
 * @param {string} deviceId - Device ID
 * @returns {string[]} Events topics
 */
export function getEventsTopic(deviceId: string): string[];
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
export function getStatusTopic(deviceId: string): string[];
/**
 * Get the response topic for a device (subscribe)
 * @param {string} deviceId - Device ID
 * @returns {string} Response topic
 */
export function getResponseTopic(deviceId: string): string;
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
export function getSubscriptionTopics(deviceId: string): string[];
/**
 * Get a command topic for a device (publish)
 * @param {string} deviceId - Device ID
 * @param {string} resource - Command resource (e.g., 'volume', 'ambients', 'card')
 * @param {string} [action] - Command action (e.g., 'set', 'start', 'stop')
 * @returns {string} Command topic
 */
export function getCommandTopic(deviceId: string, resource: string, action?: string): string;
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
export function parseTopic(topic: string): {
    deviceId: string;
    messageType: YotoMqttTopicType | "unknown";
};
/**
 * Get the events request command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Events request topic
 */
export function getEventsRequestTopic(deviceId: string): string;
/**
 * Get the status request command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Status request topic
 */
export function getStatusRequestTopic(deviceId: string): string;
/**
 * Get the volume set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Volume set topic
 */
export function getVolumeSetTopic(deviceId: string): string;
/**
 * Get the ambients set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Ambients set topic
 */
export function getAmbientsSetTopic(deviceId: string): string;
/**
 * Get the sleep timer set command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Sleep timer set topic
 */
export function getSleepTimerSetTopic(deviceId: string): string;
/**
 * Get the reboot command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Reboot topic
 */
export function getRebootTopic(deviceId: string): string;
/**
 * Get the card start command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card start topic
 */
export function getCardStartTopic(deviceId: string): string;
/**
 * Get the card stop command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card stop topic
 */
export function getCardStopTopic(deviceId: string): string;
/**
 * Get the card pause command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card pause topic
 */
export function getCardPauseTopic(deviceId: string): string;
/**
 * Get the card resume command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Card resume topic
 */
export function getCardResumeTopic(deviceId: string): string;
/**
 * Get the bluetooth on command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth on topic
 */
export function getBluetoothOnTopic(deviceId: string): string;
/**
 * Get the bluetooth off command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth off topic
 */
export function getBluetoothOffTopic(deviceId: string): string;
/**
 * Get the bluetooth delete bonds command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth delete bonds topic
 */
export function getBluetoothDeleteBondsTopic(deviceId: string): string;
/**
 * Get the bluetooth connect command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth connect topic
 */
export function getBluetoothConnectTopic(deviceId: string): string;
/**
 * Get the bluetooth disconnect command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth disconnect topic
 */
export function getBluetoothDisconnectTopic(deviceId: string): string;
/**
 * Get the bluetooth state command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Bluetooth state topic
 */
export function getBluetoothStateTopic(deviceId: string): string;
/**
 * Get the display preview command topic
 * @param {string} deviceId - Device ID
 * @returns {string} Display preview topic
 */
export function getDisplayPreviewTopic(deviceId: string): string;
/**
 * MQTT Topics for Yoto Players
 *
 * Topic builders and constants for Yoto MQTT communication
 * @see https://yoto.dev/players-mqtt/
 */
/**
 * MQTT topic type for subscriptions
 * @typedef {'events' | 'status' | 'status-legacy' | 'response'} YotoMqttTopicType
 */
/**
 * MQTT broker URL for Yoto devices
 */
export const MQTT_BROKER_URL: "wss://aqrphjqbp3u2z-ats.iot.eu-west-2.amazonaws.com";
/**
 * MQTT authorizer name for Yoto authentication
 */
export const MQTT_AUTH_NAME: "PublicJWTAuthorizer";
/**
 * MQTT connection port
 */
export const MQTT_PORT: 443;
/**
 * MQTT protocol
 */
export const MQTT_PROTOCOL: "wss";
/**
 * MQTT keepalive interval in seconds
 */
export const MQTT_KEEPALIVE: 300;
/**
 * ALPN protocols for AWS IoT
 */
export const MQTT_ALPN_PROTOCOLS: string[];
/**
 * MQTT topic type for subscriptions
 */
export type YotoMqttTopicType = "events" | "status" | "status-legacy" | "response";
//# sourceMappingURL=topics.d.ts.map