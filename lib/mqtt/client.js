/**
 * Yoto MQTT Client
 *
 * Wrapper around mqtt.js with Yoto-specific functionality
 * @see https://yoto.dev/players-mqtt/
 */

// ============================================================================
// MQTT Client: Yoto-specific wrapper around mqtt.js
// ============================================================================

/**
 * @import { MqttClient, IConnackPacket, IDisconnectPacket, Packet } from 'mqtt'
 */

/**
  * @typedef {'playing' | 'paused' | 'stopped' | 'loading'} PlaybackStatus
  */

/**
 * MQTT disconnect event metadata (from MQTT disconnect packet)
 * @typedef {Object} YotoMqttClientDisconnectMetadata
 * @property {IDisconnectPacket} packet - MQTT disconnect packet
 */

/**
 * MQTT close event metadata (from connection close)
 * @typedef {Object} YotoMqttClientCloseMetadata
 * @property {'close'} reason - Close reason
 */

/**
 * Event map for YotoMqttClient
 * @typedef {{
 *   'connect': [IConnackPacket],
 *   'disconnect': [YotoMqttClientDisconnectMetadata],
 *   'close': [YotoMqttClientCloseMetadata],
 *   'reconnect': [],
 *   'offline': [],
 *   'end': [],
 *   'error': [Error],
 *   'events': [string, YotoEventsMessage],
 *   'status': [string, YotoStatusMessage],
 *   'status-legacy': [string, YotoStatusLegacyMessage],
 *   'response': [string, YotoResponseMessage],
 *   'unknown': [string, any],
 *   'packetsend': [Packet],
 *   'packetreceive': [Packet]
 * }} YotoMqttClientEventMap
 */

/**
 * Events message from device
 * Note: Messages are partial - only changed fields are included
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceiddataevents
 * @typedef {Object} YotoEventsMessage
 * @property {boolean} [repeatAll] - Repeat all tracks
 * @property {boolean} [streaming] - Whether streaming
 * @property {number} [volume] - Current user volume level (0-16 scale, maps to userVolumePercentage in status)
 * @property {number} [volumeMax] - Maximum volume limit (0-16 scale, maps to systemVolumePercentage in status)
 * @property {boolean} [playbackWait] - Playback waiting
 * @property {boolean} [sleepTimerActive] - Sleep timer active
 * @property {number} [eventUtc] - Unix timestamp
 * @property {number} [trackLength] - Track duration in seconds
 * @property {number} [position] - Current position in seconds
 * @property {string} [cardId] - Currently playing card ID
 * @property {'card' | 'remote' | 'MQTT' } [source] - Source of playback (e.g., "card", "remote", "MQTT")
 * @property {string} [cardUpdatedAt] - ISO8601 format timestamp
 * @property {string} [chapterTitle] - Current chapter title
 * @property {string} [chapterKey] - Current chapter key
 * @property {string} [trackTitle] - Current track title
 * @property {string} [trackKey] - Current track key
 * @property {PlaybackStatus} [playbackStatus] - Playback status
 * @property {number} [sleepTimerSeconds] - Seconds remaining on sleep timer
 */

/**
 * Status message from device (MQTT /data/status)
 *
 * Device automatically publishes status updates every 5 minutes (matching keepalive interval).
 * Can also be requested on-demand via requestStatus().
 *
 * Note: MQTT types differ from HTTP - uses booleans, non-nullable fields
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceiddatastatus
 * @typedef {Object} YotoStatusMessage
 * @property {YotoMqttStatus} status - Status object
 */

/**
 * MQTT status payload structure (documented spec)
 *
 * Automatic updates (every 5 minutes): 21 fields (excludes nightlightMode and temp)
 * Requested status: All 23 fields including nightlightMode and temp
 *
 * @typedef {Object} YotoMqttStatus
 * @property {number} statusVersion - Status message version
 * @property {string} fwVersion - Firmware version
 * @property {string} productType - Product type identifier
 * @property {number} batteryLevel - Battery level percentage
 * @property {number} als - Ambient light sensor reading TODO: Find range/units
 * @property {number} freeDisk - Free disk space in bytes
 * @property {number} shutdownTimeout - Shutdown timeout in seconds
 * @property {number} dbatTimeout - DBAT timeout
 * @property {number} charging - Charging state (0 or 1)
 * @property {string} activeCard - Active card ID or 'none'
 * @property {0 | 1 | 2} cardInserted - Card insertion state (0=none, 1=physical, 2=remote)
 * @property {number} playingStatus - Playing status code
 * @property {boolean} headphones - Headphones connected
 * @property {number} dnowBrightness - Current display brightness (Integer 0-100)
 * @property {number} dayBright - Day brightness setting (Integer 0-100, 255 when 'auto')
 * @property {number} nightBright - Night brightness setting (Integer 0-100, 255 when 'auto')
 * @property {boolean} bluetoothHp - Bluetooth headphones enabled
 * @property {number} volume - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
 * @property {number} userVolume - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
 * @property {'12' | '24'} timeFormat - Time format preference
 * @property {string} [nightlightMode] - Current nightlight color (actual hex color like '0xff5733' or 'off') - only in requested status, most accurate source
 * @property {string} [temp] - Temperature reading (format varies: 'value1:value2:value3' or 'value1:notSupported') - only in requested status. value2, when a number, is the temp in Celcius
 * @property {-1 | 0 | 1} day - Day mode (0=night, 1=day, -1=unknown)
 */

/**
 * Response message from device
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidresponse
 *
 * Note: `status` contains dynamic keys and some keys may include slashes/dashes.
 * Known (observed) non-identifier keys:
 * - 'status/request' - Status request result
 * - 'events/request' - Events request result
 * - 'sleep-timer' - Sleep timer command result
 *
 * @typedef {Object} YotoResponseStatusKnown
 * @property {'OK' | 'FAIL'} [volume] - Volume command result
 * @property {'OK' | 'FAIL'} [ambients] - Ambients command result
 * @property {'OK' | 'FAIL'} [card] - Card command result
 * @property {'OK' | 'FAIL'} [events] - Events request result (alternate key to 'events/request')
 * @property {'OK' | 'FAIL'} [status] - Status request result (alternate key to 'status/request')
 * @property {'OK' | 'FAIL'} [bluetooth] - Bluetooth command result
 * @property {'OK' | 'FAIL'} [display] - Display command result
 * @property {'OK' | 'FAIL'} [reboot] - Reboot command result
 * @property {string} req_body - Stringified JSON from original request
 * @property {'OK' | 'FAIL'} [sleepTimer] - Sleep timer command result (alternate key to 'sleep-timer')
 *
 * @typedef {YotoResponseStatusKnown
 *   & Record<string, 'OK' | 'FAIL' | string | undefined>
 *   & Partial<Record<'status/request' | 'events/request' | 'sleep-timer', 'OK' | 'FAIL'>>
 * } YotoResponseStatus
 *
 * @typedef {Object} YotoResponseMessage
 * @property {YotoResponseStatus} status - Status object with dynamic resource keys
 */

/**
 * Legacy status message from device (MQTT /status)
 *
 * This is the older undocumented status topic that contains critical lifecycle information
 * not available in the documented /data/status topic, including:
 * - shutDown field: Indicates device power state changes ('userShutdown', 'nA', etc.)
 * - Startup detection: Low upTime values, utcTime: 0 after power on
 * - Full hardware diagnostics: battery voltage, memory stats, temperatures
 *
 * Both documented and legacy status topics are necessary for complete device monitoring.
 *
 * @typedef {Object} YotoStatusLegacyMessage
 * @property {YotoLegacyStatus} status - Legacy status object with full hardware details
 */

/**
 * Legacy MQTT status payload structure (undocumented)
 *
 * Contains all fields from documented status plus additional lifecycle and diagnostic fields.
 *
 * @typedef {Object} YotoLegacyStatus
 * @property {number} statusVersion - Status message version
 * @property {string} fwVersion - Firmware version
 * @property {string} shutDown - Power state: 'nA' = device running, any other value = shutting down/shut down (e.g., 'userShutdown') - ONLY in legacy topic
 * @property {number} totalDisk - Total disk space in bytes
 * @property {string} productType - Product type identifier
 * @property {number} wifiStrength - WiFi signal strength in dBm
 * @property {string} ssid - WiFi SSID
 * @property {number} rtcResetReasonPRO - RTC reset reason (PRO)
 * @property {number} rtcResetReasonAPP - RTC reset reason (APP)
 * @property {number} rtcWakeupCause - RTC wakeup cause code
 * @property {number} espResetReason - ESP reset reason code
 * @property {string} sd_info - SD card information string
 * @property {number} battery - Raw battery voltage in millivolts
 * @property {string} powerCaps - Power capabilities
 * @property {number} batteryLevel - Battery level percentage
 * @property {number} batteryTemp - Battery temperature
 * @property {string} batteryData - Battery data string (format: 'val1:val2:val3')
 * @property {number} batteryLevelRaw - Raw battery level reading
 * @property {number} free - Free memory in bytes
 * @property {number} freeDMA - Free DMA memory in bytes
 * @property {number} free32 - Free 32-bit memory in bytes
 * @property {number} upTime - Device uptime in seconds (low values indicate recent startup)
 * @property {number} utcTime - UTC timestamp (0 indicates fresh startup before time sync)
 * @property {number} aliveTime - Total alive time in seconds
 * @property {number} accelTemp - Accelerometer temperature in Celsius
 * @property {string} batteryProfile - Battery profile identifier
 * @property {number} freeDisk - Free disk space in bytes
 * @property {number} failReason - Failure reason code
 * @property {number} failData - Failure data
 * @property {number} shutdownTimeout - Shutdown timeout in seconds
 * @property {number} utcOffset - UTC offset in seconds
 * @property {string} nfcErrs - NFC error rates (format: 'xx.xx%-xx.xx%')
 * @property {number} dbatTimeout - DBAT timeout in seconds
 * @property {number} charging - Charging state (0 or 1)
 * @property {0 | 1 | 2 | 3} powerSrc - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
 * @property {string} activeCard - Active card ID or 'none'
 * @property {0 | 1 | 2} cardInserted - Card insertion state (0=none, 1=physical, 2=remote)
 * @property {number} playingStatus - Playing status code
 * @property {number} headphones - Headphones connected (0 or 1)
 * @property {number} wifiRestarts - WiFi restart count
 * @property {number} qiOtp - Qi OTP value
 * @property {number} buzzErrors - Buzzer error count
 * @property {number} dnowBrightness - Current display brightness (0-100, act)
 * @property {number} dayBright - Day brightness setting (0-100, 255 when configed to 'auto')
 * @property {number} nightBright - Night brightness setting (0-100, 255 when configed to 'auto')
 * @property {number} errorsLogged - Number of errors logged
 * @property {number} twdt - Task watchdog timer value
 * @property {number} bluetoothHp - Bluetooth headphones state (0 or 1)
 * @property {string} nightlightMode - Current nightlight color (hex color like '0xff5733' or 'off')
 * @property {number} bgDownload - Background download state
 * @property {number} bytesPS - Bytes per second
 * @property {-1 | 0 | 1} day - Day mode (0=night, 1=day, -1=unknown)
 * @property {string} temp - Temperature reading (format varies: 'value1:value2:value3' or 'value1:notSupported') - only in requested status. value2, when a number, is the temp in Celcius
 * @property {number} als - Ambient light sensor reading TODO: Find range/units
 * @property {number} volume - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
 * @property {number} userVolume - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
 * @property {'12' | '24'} timeFormat - Time format preference
 * @property {number} chgStatLevel - Charge state level
 * @property {number} missedLogs - Missed log count
 * @property {number} nfcLock - NFC lock state
 * @property {number} batteryFullPct - Battery full percentage threshold
 */

/**
 * MQTT connection state
 * @typedef {'disconnected' | 'connected' | 'reconnecting'} YotoMqttConnectionState
 */

/**
 * Events message callback
 * @callback EventsCallback
 * @param {string} topic - Raw MQTT topic string
 * @param {YotoEventsMessage} payload - Events message payload
 */

/**
 * Status message callback
 * @callback StatusCallback
 * @param {string} topic - Raw MQTT topic string
 * @param {YotoStatusMessage} payload - Status message payload
 */

/**
 * Legacy status message callback
 * @callback StatusLegacyCallback
 * @param {string} topic - Raw MQTT topic string
 * @param {YotoStatusLegacyMessage} payload - Legacy status message payload with lifecycle events
 */

/**
 * Response message callback
 * @callback ResponseCallback
 * @param {string} topic - Raw MQTT topic string
 * @param {YotoResponseMessage} payload - Response message payload
 */

/**
 * Unknown message callback
 * @callback UnknownCallback
 * @param {string} topic - Raw MQTT topic string
 * @param {any} payload - Unknown message payload
 */

import { EventEmitter } from 'events'
import {
  getSubscriptionTopics,
  getEventsTopic,
  getStatusTopic,
  getResponseTopic,
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
import { commands } from './commands.js'

/**
 * Yoto MQTT Client class
 * @extends {EventEmitter<YotoMqttClientEventMap>}
 *
 * Device automatically publishes status updates every 5 minutes when connected.
 * Status can also be requested on-demand via requestStatus() and requestEvents().
 *
 * Events:
 * - 'connect' - Emitted on successful (re)connection (connack rc=0). Passes connack packet; when sessionPresent is true and clean is false, you can rely on stored session and avoid re-subscribing. Auto-subscribe (if enabled) runs after connect and may emit errors.
 * - 'disconnect' - Emitted after receiving disconnect packet from broker. MQTT 5.0 feature. Passes metadata with disconnect packet.
 * - 'close' - Emitted after a disconnection, passes metadata with close reason.
 * - 'reconnect' - Emitted when a reconnect starts.
 * - 'offline' - Emitted when the client goes offline.
 * - 'end' - Emitted when mqttClient.end() is called (after its callback returns).
 * - 'error' - Emitted when the client cannot connect (connack rc != 0) or when a parsing error occurs.
 * - 'packetsend' - Emitted when the client sends any packet (including publish and subscription packets).
 * - 'packetreceive' - Emitted when the client receives any packet.
 * - 'events' - Device sends events, passes (topic, payload).
 * - 'status' - Device sends status, passes (topic, payload).
 * - 'status-legacy' - Device sends legacy status with lifecycle events, passes (topic, payload).
 * - 'response' - Device responds to commands, passes (topic, payload).
 * - 'unknown' - Unknown message type received, passes (topic, payload).
 */
export class YotoMqttClient extends EventEmitter {
  /** @type {typeof commands} */ commands = commands
  /** @type {MqttClient} */ mqttClient
  /** @type {string} */ deviceId
  /** @type {boolean} */ #autoSubscribe = true

  /**
   * Create a Yoto MQTT client
   * @param {MqttClient} mqttClient - Underlying MQTT client
   * @param {string} deviceId - Device ID
   * @param {Object} [options] - Client options
   * @param {boolean} [options.autoSubscribe=true] - Auto-subscribe to device topics on connect
   */
  constructor (mqttClient, deviceId, options = {}) {
    super()

    this.mqttClient = mqttClient
    this.deviceId = deviceId
    this.#autoSubscribe = options.autoSubscribe !== false

    // Bind MQTT event handlers
    this.#setupEventHandlers()
  }

  /**
   * Get current connection state
   * @returns {YotoMqttConnectionState}
   */
  get state () {
    if (this.mqttClient.connected) return 'connected'
    if (this.mqttClient.reconnecting) return 'reconnecting'
    return 'disconnected'
  }

  /**
   * Check if client is connected
   * @returns {boolean}
   */
  get connected () {
    return this.mqttClient.connected
  }

  /**
   * Setup MQTT event handlers
   */
  #setupEventHandlers () {
    // Connection established
    this.mqttClient.on('connect', (connack) => {
      this.emit('connect', connack)

      // Auto-subscribe to device topics if enabled and no prior session
      if (this.#autoSubscribe && !connack.sessionPresent) {
        this.#subscribe().catch((error) => {
          this.emit('error', error)
        })
      }
    })

    // Connection lost
    this.mqttClient.on('disconnect', (packet) => {
      /** @type {YotoMqttClientDisconnectMetadata} */
      const metadata = { packet }
      this.emit('disconnect', metadata)
    })

    // Connection closed
    this.mqttClient.on('close', () => {
      /** @type {YotoMqttClientCloseMetadata} */
      const metadata = { reason: 'close' }
      this.emit('close', metadata)
    })

    // Reconnecting
    this.mqttClient.on('reconnect', () => {
      this.emit('reconnect')
    })

    // Client went offline
    this.mqttClient.on('offline', () => {
      this.emit('offline')
    })

    // Client end requested
    this.mqttClient.on('end', () => {
      this.emit('end')
    })

    // Error occurred
    this.mqttClient.on('error', (error) => {
      this.emit('error', error)
    })

    // Packet sent
    this.mqttClient.on('packetsend', (packet) => {
      this.emit('packetsend', packet)
    })

    // Packet received
    this.mqttClient.on('packetreceive', (packet) => {
      this.emit('packetreceive', packet)
    })

    // Message received
    this.mqttClient.on('message', (topic, message) => {
      this.#handleMessage(topic, message)
    })
  }

  /**
   * Subscribe to device topics
   * @param {Array<'events' | 'status' | 'response'> | 'all'} [types='all'] - Topic types to subscribe to, or 'all' for all topics
   * @returns {Promise<void>}
   * @example
   * // Subscribe to all topics (default)
   * await client.subscribe()
   * await client.subscribe('all')
   *
   * // Subscribe to specific topics
   * await client.subscribe(['events', 'status'])
   * await client.subscribe(['response'])
   */
  async subscribe (types = 'all') {
    let topicsToSubscribe = []

    if (types === 'all') {
      // Subscribe to all device topics
      topicsToSubscribe = getSubscriptionTopics(this.deviceId)
    } else {
      // Subscribe to specific topic types
      const typeArray = Array.isArray(types) ? types : [types]

      for (const type of typeArray) {
        if (type === 'events') {
          topicsToSubscribe.push(...getEventsTopic(this.deviceId))
        } else if (type === 'status') {
          topicsToSubscribe.push(...getStatusTopic(this.deviceId))
        } else if (type === 'response') {
          topicsToSubscribe.push(getResponseTopic(this.deviceId))
        } else {
          throw new Error(`Invalid topic type: ${type}. Must be 'events', 'status', 'response', or 'all'`)
        }
      }
    }

    // Wait for all subscriptions to complete
    await Promise.all(
      topicsToSubscribe.map((topic) => {
        return new Promise((resolve, reject) => {
          this.mqttClient.subscribe(topic, (err) => {
            if (err) {
              const error = new Error(`Failed to subscribe to ${topic}: ${err.message}`)
              this.emit('error', error)
              reject(error)
            } else {
              resolve(undefined)
            }
          })
        })
      })
    )
  }

  /**
   * Subscribe to device topics (internal - used by autoSubscribe)
   * @returns {Promise<void>}
   */
  async #subscribe () {
    return this.subscribe('all')
  }

  /**
   * Handle incoming MQTT message
   * @param {string} topic - MQTT topic
   * @param {Buffer} message - Message payload
   */
  #handleMessage (topic, message) {
    const { deviceId, messageType } = parseTopic(topic)

    // Ignore messages from other devices
    if (deviceId !== this.deviceId) {
      return
    }

    try {
      const payload = JSON.parse(message.toString())

      // Emit typed events based on message type, including raw topic
      if (messageType === 'events') {
        this.emit('events', topic, /** @type {YotoEventsMessage} */ (payload))
      } else if (messageType === 'status') {
        this.emit('status', topic, /** @type {YotoStatusMessage} */ (payload))
      } else if (messageType === 'status-legacy') {
        // Legacy status topic contains lifecycle events (shutdown, startup) and full hardware diagnostics
        // The documented /data/status topic does not include these critical lifecycle fields
        this.emit('status-legacy', topic, /** @type {YotoStatusLegacyMessage} */ (payload))
      } else if (messageType === 'response') {
        this.emit('response', topic, /** @type {YotoResponseMessage} */ (payload))
      } else if (messageType === 'unknown') {
        this.emit('unknown', topic, payload)
      }
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', new Error(`Failed to parse message from ${topic}: ${error.message}`))
    }
  }

  /**
   * Connect to MQTT broker
   * @returns {Promise<void>}
   */
  async connect () {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      const onConnect = () => {
        cleanup()
        resolve()
      }

      const onError = (/** @type {Error} */ error) => {
        cleanup()
        reject(error)
      }

      const cleanup = () => {
        this.mqttClient.off('connect', onConnect)
        this.mqttClient.off('error', onError)
      }

      this.mqttClient.once('connect', onConnect)
      this.mqttClient.once('error', onError)

      // MQTT client should already be connecting from factory
      // If not connected, it will connect automatically
    })
  }

  /**
   * Disconnect from MQTT broker
   * @returns {Promise<void>}
   */
  async disconnect () {
    return new Promise((resolve) => {
      if (!this.connected && !this.mqttClient.reconnecting) {
        resolve()
        return
      }

      const onClose = () => {
        this.mqttClient.off('close', onClose)
        resolve()
      }

      this.mqttClient.once('close', onClose)
      this.mqttClient.end()
    })
  }

  /**
   * Publish a message to a topic
   * @param {string} topic - MQTT topic
   * @param {Object | string} payload - Message payload (will be JSON stringified if object)
   * @returns {Promise<void>}
   */
  async #publish (topic, payload) {
    return new Promise((resolve, reject) => {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload)

      this.mqttClient.publish(topic, message, (err) => {
        if (err) {
          reject(new Error(`Failed to publish to ${topic}: ${err.message}`))
        } else {
          resolve()
        }
      })
    })
  }

  // Command methods

  /**
   * Request current events from device
   * @param {string} [body=''] - Optional request body for tracking/identification
   * @returns {Promise<void>}
   */
  async requestEvents (body = '') {
    const topic = getEventsRequestTopic(this.deviceId)
    return this.#publish(topic, body)
  }

  /**
   * Request current status from device
   * @param {string} [body=''] - Optional request body for tracking/identification
   * @returns {Promise<void>}
   */
  async requestStatus (body = '') {
    const topic = getStatusRequestTopic(this.deviceId)
    return this.#publish(topic, body)
  }

  /**
   * Set device volume
   * @param {number} volume - Volume level [0-100]
   * @returns {Promise<void>}
   */
  async setVolume (volume) {
    const command = commands.volume(volume)
    const topic = getVolumeSetTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Set ambient light color
   * @param {number} r - Red intensity [0-255]
   * @param {number} g - Green intensity [0-255]
   * @param {number} b - Blue intensity [0-255]
   * @returns {Promise<void>}
   */
  async setAmbient (r, g, b) {
    const command = commands.ambient(r, g, b)
    const topic = getAmbientsSetTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Set ambient light color from hex
   * @param {string} hexColor - Hex color string (e.g., "#FF0000")
   * @returns {Promise<void>}
   */
  async setAmbientHex (hexColor) {
    const command = commands.ambientFromHex(hexColor)
    const topic = getAmbientsSetTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Set sleep timer
   * @param {number} seconds - Timer duration in seconds (0 to disable)
   * @returns {Promise<void>}
   */
  async setSleepTimer (seconds) {
    const command = commands.sleepTimer(seconds)
    const topic = getSleepTimerSetTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Reboot device
   * @returns {Promise<void>}
   */
  async reboot () {
    const topic = getRebootTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Start card playback
   * @param {Object} options - Card start options
   * @param {string} options.uri - Card URI (e.g., "https://yoto.io/<cardID>")
   * @param {string} [options.chapterKey] - Chapter to start from
   * @param {string} [options.trackKey] - Track to start from
   * @param {number} [options.secondsIn] - Playback start offset in seconds
   * @param {number} [options.cutOff] - Playback stop offset in seconds
   * @param {boolean} [options.anyButtonStop] - Whether button press stops playback
   * @returns {Promise<void>}
   */
  async startCard (options) {
    const command = commands.cardStart(options)
    const topic = getCardStartTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Stop card playback
   * @returns {Promise<void>}
   */
  async stopCard () {
    const topic = getCardStopTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Pause card playback
   * @returns {Promise<void>}
   */
  async pauseCard () {
    const topic = getCardPauseTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Resume card playback
   * @returns {Promise<void>}
   */
  async resumeCard () {
    const topic = getCardResumeTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Turn Bluetooth on
   * @param {Object} [options] - Bluetooth options
   * @param {string} [options.action] - Bluetooth action
   * @param {boolean | string} [options.mode] - Bluetooth mode
   * @param {number} [options.rssi] - RSSI threshold
   * @param {string} [options.name] - Target device name
   * @param {string} [options.mac] - Target device MAC
   * @returns {Promise<void>}
   */
  async bluetoothOn (options) {
    const command = commands.bluetoothOn(options)
    const topic = getBluetoothOnTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Turn Bluetooth off
   * @returns {Promise<void>}
   */
  async bluetoothOff () {
    const topic = getBluetoothOffTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Enable Bluetooth speaker mode
   * @returns {Promise<void>}
   */
  async bluetoothSpeakerMode () {
    const command = commands.bluetoothSpeaker()
    const topic = getBluetoothOnTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Enable Bluetooth audio source mode
   * @returns {Promise<void>}
   */
  async bluetoothAudioSourceMode () {
    const command = commands.bluetoothAudioSource()
    const topic = getBluetoothOnTopic(this.deviceId)
    return this.#publish(topic, command)
  }

  /**
   * Delete all Bluetooth bonds
   * @returns {Promise<void>}
   */
  async bluetoothDeleteBonds () {
    const topic = getBluetoothDeleteBondsTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Connect to Bluetooth device
   * @returns {Promise<void>}
   */
  async bluetoothConnect () {
    const topic = getBluetoothConnectTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Disconnect Bluetooth device
   * @returns {Promise<void>}
   */
  async bluetoothDisconnect () {
    const topic = getBluetoothDisconnectTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Get Bluetooth state
   * @returns {Promise<void>}
   */
  async bluetoothGetState () {
    const topic = getBluetoothStateTopic(this.deviceId)
    return this.#publish(topic, '')
  }

  /**
   * Preview display icon
   * @param {Object} options - Display preview options
   * @param {string} options.uri - Icon URI
   * @param {number} options.timeout - Display duration in seconds
   * @param {boolean} options.animated - Whether icon is animated
   * @returns {Promise<void>}
   */
  async displayPreview (options) {
    const command = commands.displayPreview(options)
    const topic = getDisplayPreviewTopic(this.deviceId)
    return this.#publish(topic, command)
  }
}
