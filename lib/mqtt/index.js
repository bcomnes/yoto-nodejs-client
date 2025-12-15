/**
 * Yoto MQTT Module
 *
 * MQTT client for connecting to and controlling Yoto players
 * @see https://yoto.dev/players-mqtt/
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
 *   console.log('Now playing:', message.trackTitle)
 * })
 *
 * client.on('status', (message) => {
 *   console.log('Battery:', message.batteryLevel, '%')
 * })
 *
 * await client.connect()
 * await client.setVolume(50)
 * await client.setAmbientHex('#FF0000')
 * ```
 */

// Factory
export { createYotoMqttClient } from './factory.js'

// Client class
export { YotoMqttClient } from './client.js'

// Command builders
export {
  createVolumeCommand,
  createAmbientCommand,
  createAmbientCommandFromHex,
  createSleepTimerCommand,
  createCardStartCommand,
  createBluetoothOnCommand,
  createBluetoothSpeakerCommand,
  createBluetoothAudioSourceCommand,
  createDisplayPreviewCommand,
  commands
} from './commands.js'

// Topic builders and constants
export {
  MQTT_BROKER_URL,
  MQTT_AUTH_NAME,
  MQTT_PORT,
  MQTT_PROTOCOL,
  MQTT_KEEPALIVE,
  MQTT_ALPN_PROTOCOLS,
  getEventsTopic,
  getStatusTopic,
  getResponseTopic,
  getSubscriptionTopics,
  getCommandTopic,
  parseTopic,
  getEventsRequestTopic,
  getStatusRequestTopic,
  getVolumeSetTopic,
  getAmbientsSetTopic,
  getSleepTimerSetTopic,
  getRebootTopic,
  getCardStartTopic,
  getCardStopTopic,
  getCardPauseTopic,
  getCardResumeTopic,
  getBluetoothOnTopic,
  getBluetoothOffTopic,
  getBluetoothDeleteBondsTopic,
  getBluetoothConnectTopic,
  getBluetoothDisconnectTopic,
  getBluetoothStateTopic,
  getDisplayPreviewTopic
} from './topics.js'
