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
 * @import { MqttClient } from 'mqtt'
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
 * @property {string} [source] - Source of playback (e.g., "card", "remote", "MQTT")
 * @property {string} [cardUpdatedAt] - ISO8601 format timestamp
 * @property {string} [chapterTitle] - Current chapter title
 * @property {string} [chapterKey] - Current chapter key
 * @property {string} [trackTitle] - Current track title
 * @property {string} [trackKey] - Current track key
 * @property {'playing' | 'paused' | 'stopped' | 'loading' | string} [playbackStatus] - Playback status
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
 * @property {number} als - Ambient light sensor reading
 * @property {number} freeDisk - Free disk space in bytes
 * @property {number} shutdownTimeout - Shutdown timeout in seconds
 * @property {number} dbatTimeout - DBAT timeout
 * @property {number} charging - Charging state (0 or 1)
 * @property {string} activeCard - Active card ID or 'none'
 * @property {0 | 1 | 2} cardInserted - Card insertion state (0=none, 1=physical, 2=remote)
 * @property {number} playingStatus - Playing status code
 * @property {boolean} headphones - Headphones connected
 * @property {number} dnowBrightness - Current display brightness (Integer 0-100)
 * @property {number} dayBright - Day brightness setting (Integer 0-100)
 * @property {number} nightBright - Night brightness setting (Integer 0-100)
 * @property {boolean} bluetoothHp - Bluetooth headphones enabled
 * @property {number} volume - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
 * @property {number} userVolume - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
 * @property {'12' | '24'} timeFormat - Time format preference
 * @property {string} [nightlightMode] - Current nightlight color (actual hex color like '0xff5733' or 'off') - only in requested status, most accurate source
 * @property {string} [temp] - Temperature reading (format varies: 'value1:value2:value3' or 'value1:notSupported') - only in requested status
 * @property {-1 | 0 | 1} day - Day mode (0=night, 1=day, -1=unknown)
 */

/**
 * Response message from device
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidresponse
 * @typedef {Object} YotoResponseMessage
 * @property {Object} status - Status object with dynamic resource keys
 * @property {'OK' | 'FAIL'} [status.volume] - Volume command result
 * @property {'OK' | 'FAIL'} [status.ambients] - Ambients command result
 * @property {'OK' | 'FAIL'} [status.card] - Card command result
 * @property {'OK' | 'FAIL'} [status.events] - Events request result
 * @property {'OK' | 'FAIL'} [status.status] - Status request result
 * @property {'OK' | 'FAIL'} [status.bluetooth] - Bluetooth command result
 * @property {'OK' | 'FAIL'} [status.display] - Display command result
 * @property {'OK' | 'FAIL'} [status.reboot] - Reboot command result
 * @property {string} status.req_body - Stringified JSON from original request
 * @property {'OK' | 'FAIL'} status.sleepTimer - Sleep timer command result (note: actual field name is 'sleep-timer')

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
 * @property {number} dnowBrightness - Current display brightness
 * @property {number} dayBright - Day brightness setting
 * @property {number} nightBright - Night brightness setting
 * @property {number} errorsLogged - Number of errors logged
 * @property {number} twdt - Task watchdog timer value
 * @property {number} bluetoothHp - Bluetooth headphones state (0 or 1)
 * @property {string} nightlightMode - Current nightlight color (hex color like '0xff5733' or 'off')
 * @property {number} bgDownload - Background download state
 * @property {number} bytesPS - Bytes per second
 * @property {-1 | 0 | 1} day - Day mode (0=night, 1=day, -1=unknown)
 * @property {string} temp - Temperature readings (format: 'val1:val2:val3')
 * @property {number} als - Ambient light sensor reading
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
 * @extends EventEmitter
 *
 * Device automatically publishes status updates every 5 minutes when connected.
 * Status can also be requested on-demand via requestStatus() and requestEvents().
 *
 * @fires YotoMqttClient#events - Emits (topic, payload) when device sends events
 * @fires YotoMqttClient#status - Emits (topic, payload) when device sends status (automatic every 5 min, or on-demand)
 * @fires YotoMqttClient#status-legacy - Emits (topic, payload) when device sends legacy status with lifecycle events
 * @fires YotoMqttClient#response - Emits (topic, payload) when device responds to commands
 * @fires YotoMqttClient#unknown - Emits (topic, payload) when receiving unknown message type
 * @fires YotoMqttClient#connected
 * @fires YotoMqttClient#disconnected
 * @fires YotoMqttClient#reconnecting
 * @fires YotoMqttClient#error
 */
export class YotoMqttClient extends EventEmitter {
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
    this.autoSubscribe = options.autoSubscribe !== false

    // Bind MQTT event handlers
    this.#setupEventHandlers()

    // Export command builders for convenience
    this.commands = commands
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
    this.mqttClient.on('connect', async () => {
      // Auto-subscribe to device topics if enabled
      if (this.autoSubscribe) {
        await this.#subscribe()
      }

      // Only emit connected after subscriptions are ready
      this.emit('connected')
    })

    // Connection lost
    this.mqttClient.on('disconnect', () => {
      this.emit('disconnected')
    })

    // Connection closed
    this.mqttClient.on('close', () => {
      this.emit('disconnected')
    })

    // Reconnecting
    this.mqttClient.on('reconnect', () => {
      this.emit('reconnecting')
    })

    // Error occurred
    this.mqttClient.on('error', (error) => {
      this.emit('error', error)
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
