/**
 * Yoto Device Client - Stateful device manager
 *
 * Manages device state from both HTTP and MQTT sources, providing a unified
 * interface for device status, configuration, and real-time updates.
 *
 */

/**
 * @import { YotoClient } from './api-client.js'
 * @import { YotoDevice, YotoDeviceConfig, YotoDeviceShortcuts, YotoDeviceFullStatus, YotoDeviceStatusResponse, YotoDeviceCommand, YotoDeviceCommandResponse } from './api-endpoints/devices.js'
 * @import { YotoMqttClient, YotoMqttStatus, YotoEventsMessage, YotoLegacyStatus, YotoMqttClientDisconnectMetadata, YotoMqttClientCloseMetadata, PlaybackStatus } from './mqtt/client.js'
 * @import { MqttClientOptions } from './mqtt/factory.js'
 */

import { EventEmitter } from 'events'
import { parseTemperature } from './helpers/temperature.js'
import { detectPowerState } from './helpers/power-state.js'
import { typedKeys } from './helpers/typed-keys.js'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Card insertion state values
 * @typedef {'none' | 'physical' | 'remote'} CardInsertionState
 */

/**
 * Converts numeric card insertion state to string union
 * @param {0 | 1 | 2} numericState - Numeric state from API
 * @returns {CardInsertionState} String union value
 */
function convertCardInsertionState (numericState) {
  switch (numericState) {
    case 0: return 'none'
    case 1: return 'physical'
    case 2: return 'remote'
    default: return 'none'
  }
}

/**
 * Convert numeric day mode to string union
 * @param {number} numericMode - Numeric day mode value
 * @returns {DayMode} String representation of day mode
 */
function convertDayMode (numericMode) {
  switch (numericMode) {
    case -1: return 'unknown'
    case 0: return 'night'
    case 1: return 'day'
    default: return 'unknown'
  }
}

/**
 * Day mode state
 * @typedef {'unknown' | 'night' | 'day'} DayMode
 */

/**
 * Convert numeric power source to string union
 * @param {number} numericSource - Numeric power source value
 * @returns {PowerSource} String representation of power source
 */
function convertPowerSource (numericSource) {
  switch (numericSource) {
    case 0: return 'battery'
    case 1: return 'dock'
    case 2: return 'usb-c'
    case 3: return 'wireless'
    default: return 'battery'
  }
}

/**
 * Power source state
 * @typedef {'battery' | 'dock' | 'usb-c' | 'wireless'} PowerSource
 */

/**
 * Official Yoto nightlight colors
 *
 * Maps raw nightlight values to official color names.
 */
export const NIGHTLIGHT_COLORS = {
  '0x643600': 'Orange Peel',
  '0x640000': 'Tambourine Red',
  '0x602d3c': 'Lilac',
  '0x5a6400': 'Apple Green',
  '0x644800': 'Bumblebee Yellow',
  '0x194a55': 'Sky Blue',
  '0x646464': 'White',
  '0x000000': 'No Light (screen down)',
  off: 'Off (screen up)'
}

/**
 * Get the official name for a nightlight color
 * @param {string} colorValue - Nightlight color value (hex code or 'off')
 * @returns {string} Official color name or the original value if not found
 */
export function getNightlightColorName (colorValue) {
  return NIGHTLIGHT_COLORS[/** @type {keyof typeof NIGHTLIGHT_COLORS} */ (colorValue)] || colorValue
}

/**
 * Canonical device status - normalized format for both HTTP and MQTT sources
 *
 * This unified format resolves differences between HTTP and MQTT:
 * - HTTP uses string booleans ('0'/'1'), MQTT uses actual booleans
 * - HTTP has nullable fields, MQTT fields are non-nullable
 * - Field names match YotoDeviceStatusResponse with fallback to YotoDeviceFullStatus
 *
 * @typedef {Object} YotoDeviceStatus
 * @property {string | null} activeCardId - Active card ID or null when no card is active
 * @property {number} batteryLevelPercentage - Battery level percentage (integer 0-100)
 * @property {boolean} isCharging - Whether device is currently charging
 * @property {boolean} isOnline - Whether device is currently online
 * @property {number} volume - User volume level (0-16 scale)
 * @property {number} maxVolume - Maximum volume limit (0-16 scale)
 * @property {CardInsertionState} cardInsertionState - Card insertion state
 * @property {DayMode} dayMode - Day mode status
 * @property {PowerSource} powerSource - Power source
 * @property {string} firmwareVersion - Firmware version
 * @property {number} wifiStrength - WiFi signal strength in dBm
 * @property {number} freeDiskSpaceBytes - Free disk space in bytes
 * @property {number} totalDiskSpaceBytes - Total disk space in bytes
 * @property {boolean} isAudioDeviceConnected - Whether headphones are connected
 * @property {boolean} isBluetoothAudioConnected - Whether Bluetooth headphones are enabled
 * @property {string} nightlightMode - Current nightlight color (6-digit hex color like '0xff5733' or 'off'). Most accurate value comes from MQTT status. HTTP endpoint returns either 'off' or '0x000000'. Note: This is the live status; configured colors are in config.ambientColour (day) and config.nightAmbientColour (night). Only available on devices with colored nightlight (v3).
 * @property {string | number | null} temperatureCelsius - Temperature in Celsius (null if not supported, can be number, string "0", or "notSupported") TODO: Number or null only
 * @property {number} ambientLightSensorReading - Ambient light sensor reading TODO: Figure out units
 * @property {number | null} displayBrightness - Current display brightness (null when device is off) - from YotoDeviceFullStatus (dnowBrightness integer 0-100)
 * @property {'12' | '24' | null} timeFormat - Time format preference - from YotoDeviceFullStatus
 * @property {number} uptime - Device uptime in seconds
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 * @property {string} source - Data source ('http' or 'mqtt') - metadata field added by stateful client
 */
export const YotoDeviceStatusType = {}

/**
 * Playback state from MQTT events
 * @typedef {Object} YotoPlaybackState
 * @property {string | null} cardId - Currently playing card ID TODO: Figure out name of card
 * @property {string | null} source - Playback source (e.g., 'card', 'remote', 'MQTT') TODO: Figure out what 'mqtt' source means. Card means card, remote means remotly played card.
 * @property {PlaybackStatus | null} playbackStatus - Playback status
 * @property {string | null} trackTitle - Current track title
 * @property {string | null} trackKey - Current track key
 * @property {string | null} chapterTitle - Current chapter title
 * @property {string | null} chapterKey - Current chapter key
 * @property {number | null} position - Current position in seconds
 * @property {number | null} trackLength - Track duration in seconds
 * @property {boolean | null} streaming - Whether streaming
 * @property {boolean | null} sleepTimerActive - Sleep timer active
 * @property {number | null} sleepTimerSeconds - Seconds remaining on sleep timer
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 */
export const YotoPlaybackStateType = {}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Complete device client state
 * @typedef {Object} YotoDeviceClientState
 * @property {YotoDevice} device - Basic device information
 * @property {YotoDeviceConfig} config - Device configuration (always initialized)
 * @property {YotoDeviceShortcuts} shortcuts - Button shortcuts (always initialized)
 * @property {YotoDeviceStatus} status - Current device status (always initialized)
 * @property {YotoPlaybackState} playback - Current playback state (always initialized)
 * @property {boolean} initialized - Whether device has been initialized
 * @property {boolean} running - Whether device client is currently running (started)
 * @property {Object} lastUpdate - Timestamps of last updates
 * @property {number | null} lastUpdate.config - Last config update timestamp
 * @property {number | null} lastUpdate.status - Last status update timestamp
 * @property {number | null} lastUpdate.playback - Last playback update timestamp
 * @property {string | null} lastUpdate.source - Source of last status update ('http' or 'mqtt')
 */

/**
 * Device hardware capabilities based on deviceType
 * @typedef {Object} YotoDeviceCapabilities
 * @property {boolean} hasTemperatureSensor - Whether device has a temperature sensor
 * @property {boolean} hasAmbientLightSensor - Whether device has an ambient light sensor
 * @property {boolean} hasColoredNightlight - Whether device has a colored nightlight
 * @property {boolean} supported - Whether this device type is supported
 */

/**
 * Nightlight information
 * @typedef {Object} YotoDeviceNightlightInfo
 * @property {string} value - Raw nightlight value (hex color like '0x643600' or 'off')
 * @property {string} name - Official color name (e.g., 'Orange Peel', 'Off (screen up)')
 * @property {boolean} supported - Whether this device supports colored nightlight
 */

/**
 * Device client initialization options
 * @typedef {Object} YotoDeviceModelOptions
 * @property {MqttClientOptions} [mqttOptions] - MQTT.js client options to pass through to factory
 * @property {number} [httpPollIntervalMs=600000] - Background HTTP polling interval for config+status sync (default: 10 minutes)
 */

/**
 * Online event metadata
 * @typedef {Object} YotoDeviceOnlineMetadata
 * @property {'startup' | 'activity'} reason - Reason device came online
 * @property {number | null} [upTime] - Device uptime in seconds (only present for 'startup' reason)
 */

/**
 * Offline event metadata
 * @typedef {Object} YotoDeviceOfflineMetadata
 * @property {'shutdown' | 'timeout' | 'http-status'} reason - Reason device went offline
 * @property {string | null} [shutDownReason] - Shutdown reason from device (only present for 'shutdown' reason)
 * @property {number | null} [timeSinceLastSeen] - Time since last seen in ms (only present for 'timeout' reason)
 * @property {string} [source] - Source of status update (only present for 'http-status' reason)
 */

/**
 * MQTT disconnect event metadata (from MQTT disconnect packet)
 * @typedef {YotoMqttClientDisconnectMetadata} YotoMqttDisconnectMetadata
 */

/**
 * MQTT close event metadata (from connection close)
 * @typedef {YotoMqttClientCloseMetadata} YotoMqttCloseMetadata
 */

/**
 * Started event metadata
 * @typedef {Object} YotoDeviceStartedMetadata
 * @property {YotoDevice} device - Device information
 * @property {YotoDeviceConfig} config - Device configuration
 * @property {YotoDeviceShortcuts} shortcuts - Device shortcuts
 * @property {YotoDeviceStatus} status - Device status
 * @property {YotoPlaybackState} playback - Playback state
 * @property {boolean} initialized - Whether initialized
 * @property {boolean} running - Whether running
 */

/**
 * Event map for YotoDeviceModel
 * @typedef {{
 *   'started': [YotoDeviceStartedMetadata],
 *   'stopped': [],
 *   'statusUpdate': [YotoDeviceStatus, string, Set<keyof YotoDeviceStatus>],
 *   'configUpdate': [YotoDeviceConfig, Set<keyof YotoDeviceConfig>],
 *   'playbackUpdate': [YotoPlaybackState, Set<keyof YotoPlaybackState>],
 *   'online': [YotoDeviceOnlineMetadata],
 *   'offline': [YotoDeviceOfflineMetadata],
 *   'mqttConnect': [],
 *   'mqttDisconnect': [YotoMqttDisconnectMetadata],
 *   'mqttClose': [YotoMqttCloseMetadata],
 *   'mqttReconnect': [],
 *   'mqttOffline': [],
 *   'mqttEnd': [],
 *   'error': [Error]
 * }} YotoDeviceModelEventMap
 */

// ============================================================================
// YotoDeviceModel Class
// ============================================================================

/**
 * Stateful device client that manages device state primarily from MQTT with HTTP background sync
 *
 * Philosophy:
 * - MQTT is the primary source for all real-time status updates
 * - MQTT connection is always maintained and handles its own reconnection
 * - Device online/offline state is tracked by MQTT activity (sets online) and explicit shutdown messages
 * - HTTP background polling runs every 10 minutes to sync config+status regardless of online state
 * - HTTP status updates emit offline events if device state changes to offline
 *
 * Events:
 * - 'started' - Emitted when device client is started, passes metadata object
 * - 'stopped' - Emitted when device client is stopped
 * - 'statusUpdate' - Emitted when status changes, passes (status, source, changedFields)
 * - 'configUpdate' - Emitted when config changes, passes (config, changedFields)
 * - 'playbackUpdate' - Emitted when playback state changes, passes (playback, changedFields)
 * - 'online' - Emitted when device comes online, passes metadata with reason and optional upTime
 * - 'offline' - Emitted when device goes offline, passes metadata with reason and optional shutDownReason or timeSinceLastSeen
 * - 'mqttConnect' - Emitted when MQTT client connects
 * - 'mqttDisconnect' - Emitted when MQTT disconnect packet received, passes metadata with disconnect packet
 * - 'mqttClose' - Emitted when MQTT connection closes, passes metadata with close reason
 * - 'mqttReconnect' - Emitted when MQTT client is reconnecting
 * - 'mqttOffline' - Emitted when MQTT client goes offline
 * - 'mqttEnd' - Emitted when MQTT client end is called
 * - 'error' - Emitted when an error occurs, passes error
 *
 * @extends {EventEmitter<YotoDeviceModelEventMap>}
 */
export class YotoDeviceModel extends EventEmitter {
  /** @type {YotoClient} */ #client
  /** @type {YotoMqttClient | null} */ #mqttClient = null
  /** @type {YotoDeviceClientState} */ #state
  /** @type {YotoDeviceModelOptions} */ #options
  /** @type {number} */ #mqttRequestStatusDelayMs = 1000
  /** @type {number} */ #mqttRequestEventsDelayMs = 3000
  /** @type {NodeJS.Timeout | null} */ #statusRequestTimer = null
  /** @type {NodeJS.Timeout | null} */ #eventsRequestTimer = null
  /** @type {NodeJS.Timeout | null} */ #backgroundPollTimer = null
  /** @type {number | null} */ #shutdownDetectedAt = null

  /**
   * Create a Yoto device client
   * @param {YotoClient} client - Authenticated YotoClient instance
   * @param {YotoDevice} device - Device object from getDevices()
   * @param {YotoDeviceModelOptions} [options] - Client options
   */
  constructor (client, device, options = {}) {
    super()

    this.#client = client
    this.#options = {
      httpPollIntervalMs: options.httpPollIntervalMs ?? 600000 // 10 minutes
    }

    // Only set mqttOptions if provided (exactOptionalPropertyTypes compatibility)
    if (options.mqttOptions !== undefined) {
      this.#options.mqttOptions = options.mqttOptions
    }

    // Initialize state
    this.#state = {
      device,
      config: createEmptyDeviceConfig(),
      shortcuts: createEmptyDeviceShortcuts(),
      status: createEmptyDeviceStatus(device),
      playback: createEmptyPlaybackState(),
      initialized: false,
      running: false,
      lastUpdate: {
        config: null,
        status: null,
        playback: null,
        source: null
      }
    }

    this.#shutdownDetectedAt = null
  }

  // ==========================================================================
  // Internal Getters/Setters
  // ==========================================================================

  /**
   * Get device online status
   * @returns {boolean}
   */
  get #deviceOnline () {
    return this.#state.status.isOnline
  }

  /**
   * Set device online status
   * @param {boolean} value
   */
  set #deviceOnline (value) {
    this.#state.status.isOnline = value
  }

  /**
   * Get MQTT connection status
   * @returns {boolean}
   */
  get #mqttConnected () {
    return this.#mqttClient?.connected ?? false
  }

  // ==========================================================================
  // Public API - State Accessors
  /**
   * Get device information
   * @returns {YotoDevice}
   */
  get device () { return { ...this.#state.device } }

  /**
   * Get current device status
   * @returns { YotoDeviceStatus }
   */
  get status () { return this.#state.status }

  /**
   * Get device configuration
   * @returns {YotoDeviceConfig}
   */
  get config () { return this.#state.config }

  /**
   * Get device shortcuts
   * @returns {YotoDeviceShortcuts }
   */
  get shortcuts () { return this.#state.shortcuts }

  /**
   * Get current playback state
   * @returns {YotoPlaybackState}
   */
  get playback () { return this.#state.playback }

  /**
   * Check if device has been initialized
   * @returns {boolean}
   */
  get initialized () { return this.#state.initialized }

  /**
   * Check if device client is running (started)
   * @returns {boolean}
   */
  get running () { return this.#state.running }

  /**
   * Check if MQTT client is connected
   * @returns {boolean}
   */
  get mqttConnected () { return this.#mqttConnected }

  /**
   * Check if device is currently online (based on MQTT activity)
   * @returns {boolean}
   */
  get deviceOnline () { return this.#deviceOnline }

  /**
   * Get device hardware capabilities based on deviceType
   * @returns {YotoDeviceCapabilities}
   */
  get capabilities () {
    const deviceType = this.#state.device.deviceType

    // v3 has full sensor suite and colored nightlight
    if (deviceType === 'v3') {
      return {
        hasTemperatureSensor: true,
        hasAmbientLightSensor: true,
        hasColoredNightlight: true,
        supported: true
      }
    }

    // mini has no sensors or colored nightlight
    if (deviceType === 'mini') {
      return {
        hasTemperatureSensor: false,
        hasAmbientLightSensor: false,
        hasColoredNightlight: false,
        supported: true
      }
    }

    // Unknown/unsupported device type
    return {
      hasTemperatureSensor: false,
      hasAmbientLightSensor: false,
      hasColoredNightlight: false,
      supported: false
    }
  }

  /**
   * Get nightlight information including color name
   * @returns {YotoDeviceNightlightInfo}
   */
  get nightlight () {
    const value = this.#state.status.nightlightMode
    const supported = this.capabilities.hasColoredNightlight
    const name = getNightlightColorName(value)

    return {
      value,
      name,
      supported
    }
  }

  /**
   * Static reference to nightlight colors map
   *
   * @type {Record<string, string>}
   */
  static NIGHTLIGHT_COLORS = NIGHTLIGHT_COLORS

  /**
   * Static method to get nightlight color name
   *
   * @param {string} colorValue - Nightlight color value (hex code or 'off')
   * @returns {string} Official color name or the original value if not found
   */
  static getNightlightColorName = getNightlightColorName

  // ==========================================================================
  // Public API - Lifecycle Management
  // ==========================================================================

  /**
   * Start the device client - fetches config, connects to MQTT, begins monitoring
   * @returns {Promise<void>}
   * @throws {Error} If start fails
   */
  async start () {
    if (this.#state.running) {
      return // Already running
    }

    try {
      // Fetch device config (includes status and shortcuts)
      const configResponse = await this.#client.getDeviceConfig({
        deviceId: this.#state.device.deviceId
      })

      // Update state with config data
      this.#state.config = configResponse.device.config
      this.#state.shortcuts = configResponse.device.shortcuts

      // Update device info with additional details from config
      this.#state.device = {
        ...this.#state.device,
        name: configResponse.device.name,
        online: configResponse.device.online
      }

      // Fetch device status from status endpoint
      const statusResponse = await this.#client.getDeviceStatus({
        deviceId: this.#state.device.deviceId
      })

      // Update status from dedicated status endpoint
      this.#updateStatusFromStatusResponse(statusResponse)

      // Also update from full status if available in config response
      if (configResponse.device.status) {
        this.#updateStatusFromFullStatus(configResponse.device.status)
      }

      // Mark config as updated
      this.#state.lastUpdate.config = Date.now()

      // Always initialize MQTT - it's the primary status source
      await this.#initializeMqtt()

      // Start background HTTP polling - syncs config+status every 10 minutes
      this.#startBackgroundPolling()

      // Mark as initialized and running
      this.#state.initialized = true
      this.#state.running = true

      this.emit('started', {
        device: this.device,
        config: this.config,
        shortcuts: this.shortcuts,
        status: this.status,
        playback: this.playback,
        initialized: this.initialized,
        running: this.running
      })
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Stop the device client - disconnects MQTT, stops background polling
   * @returns {Promise<void>}
   */
  async stop () {
    if (!this.#state.running) {
      return // Not running
    }

    try {
      // Clear all timers
      this.#clearAllTimers()

      // Disconnect MQTT
      if (this.#mqttClient) {
        await this.#mqttClient.disconnect()
        this.#mqttClient = null
      }

      // Mark as stopped
      this.#state.running = false

      this.emit('stopped')
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Restart the device client - stops and starts again
   * @returns {Promise<void>}
   */
  async restart () {
    await this.stop()
    await sleep(5000)
    await this.start()
  }

  /**
   * Get MQTT client instance
   * @returns {YotoMqttClient | null}
   */
  get mqttClient () {
    return this.#mqttClient
  }

  /**
   * Get MQTT client instance or throw if not initialized
   * @returns {YotoMqttClient}
   */
  #requireMqttClient () {
    if (!this.#mqttClient) {
      throw new Error('MQTT client not initialized. Call start() before using MQTT commands.')
    }
    return this.#mqttClient
  }

  // ==========================================================================
  // Public API - MQTT Commands
  // ==========================================================================

  /**
   * Request current events from device over MQTT
   * @param {string} [body=''] - Optional request body for tracking/identification
   * @returns {Promise<void>}
   */
  async requestEvents (body = '') {
    return await this.#requireMqttClient().requestEvents(body)
  }

  /**
   * Request current status from device over MQTT
   * @param {string} [body=''] - Optional request body for tracking/identification
   * @returns {Promise<void>}
   */
  async requestStatus (body = '') {
    return await this.#requireMqttClient().requestStatus(body)
  }

  /**
   * Set device volume over MQTT
   * @param {number} volume - Volume level [0-100]
   * @returns {Promise<void>}
   */
  async setVolume (volume) {
    return await this.#requireMqttClient().setVolume(volume)
  }

  /**
   * Set ambient light color over MQTT
   * @param {number} r - Red intensity [0-255]
   * @param {number} g - Green intensity [0-255]
   * @param {number} b - Blue intensity [0-255]
   * @returns {Promise<void>}
   */
  async setAmbient (r, g, b) {
    return await this.#requireMqttClient().setAmbient(r, g, b)
  }

  /**
   * Set ambient light color from hex over MQTT
   * @param {string} hexColor - Hex color string (e.g., "#FF0000")
   * @returns {Promise<void>}
   */
  async setAmbientHex (hexColor) {
    return await this.#requireMqttClient().setAmbientHex(hexColor)
  }

  /**
   * Set sleep timer over MQTT
   * @param {number} seconds - Timer duration in seconds (0 to disable)
   * @returns {Promise<void>}
   */
  async setSleepTimer (seconds) {
    return await this.#requireMqttClient().setSleepTimer(seconds)
  }

  /**
   * Reboot device over MQTT
   * @returns {Promise<void>}
   */
  async reboot () {
    return await this.#requireMqttClient().reboot()
  }

  /**
   * Start card playback over MQTT
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
    return await this.#requireMqttClient().startCard(options)
  }

  /**
   * Stop card playback over MQTT
   * @returns {Promise<void>}
   */
  async stopCard () {
    return await this.#requireMqttClient().stopCard()
  }

  /**
   * Pause card playback over MQTT
   * @returns {Promise<void>}
   */
  async pauseCard () {
    return await this.#requireMqttClient().pauseCard()
  }

  /**
   * Resume card playback over MQTT
   * @returns {Promise<void>}
   */
  async resumeCard () {
    return await this.#requireMqttClient().resumeCard()
  }

  /**
   * Turn Bluetooth on over MQTT
   * @param {Object} [options] - Bluetooth options
   * @param {string} [options.action] - Bluetooth action
   * @param {boolean | string} [options.mode] - Bluetooth mode
   * @param {number} [options.rssi] - RSSI threshold
   * @param {string} [options.name] - Target device name
   * @param {string} [options.mac] - Target device MAC
   * @returns {Promise<void>}
   */
  async bluetoothOn (options) {
    return await this.#requireMqttClient().bluetoothOn(options)
  }

  /**
   * Turn Bluetooth off over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothOff () {
    return await this.#requireMqttClient().bluetoothOff()
  }

  /**
   * Enable Bluetooth speaker mode over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothSpeakerMode () {
    return await this.#requireMqttClient().bluetoothSpeakerMode()
  }

  /**
   * Enable Bluetooth audio source mode over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothAudioSourceMode () {
    return await this.#requireMqttClient().bluetoothAudioSourceMode()
  }

  /**
   * Delete all Bluetooth bonds over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothDeleteBonds () {
    return await this.#requireMqttClient().bluetoothDeleteBonds()
  }

  /**
   * Connect to Bluetooth device over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothConnect () {
    return await this.#requireMqttClient().bluetoothConnect()
  }

  /**
   * Disconnect Bluetooth device over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothDisconnect () {
    return await this.#requireMqttClient().bluetoothDisconnect()
  }

  /**
   * Get Bluetooth state over MQTT
   * @returns {Promise<void>}
   */
  async bluetoothGetState () {
    return await this.#requireMqttClient().bluetoothGetState()
  }

  /**
   * Preview display icon over MQTT
   * @param {Object} options - Display preview options
   * @param {string} options.uri - Icon URI
   * @param {number} options.timeout - Display duration in seconds
   * @param {boolean} options.animated - Whether icon is animated
   * @returns {Promise<void>}
   */
  async displayPreview (options) {
    return await this.#requireMqttClient().displayPreview(options)
  }

  // ==========================================================================
  // Public API - Device Control
  // ==========================================================================

  /**
   * Refresh device status from HTTP API
   * This is primarily used as a fallback when device is offline
   * @returns {Promise<YotoDeviceStatus>}
   */
  /**
   * Refresh device config from HTTP API
   * @returns {Promise<YotoDeviceConfig>}
   */
  async refreshConfig () {
    const configResponse = await this.#client.getDeviceConfig({
      deviceId: this.#state.device.deviceId
    })

    this.#updateConfigFromHttp(
      configResponse.device.config,
      configResponse.device.shortcuts ?? createEmptyDeviceShortcuts()
    )

    // Also fetch and update status from status endpoint
    const statusResponse = await this.#client.getDeviceStatus({
      deviceId: this.#state.device.deviceId
    })
    this.#updateStatusFromStatusResponse(statusResponse)

    const config = this.config
    if (!config) throw new Error('Config not available after refresh')
    return config
  }

  /**
   * Update device configuration
   * @param {Partial<YotoDeviceConfig>} configUpdate - Configuration changes
   * @returns {Promise<void>}
   */
  async updateConfig (configUpdate) {
    await this.#client.updateDeviceConfig({
      deviceId: this.#state.device.deviceId,
      configUpdate: {
        config: configUpdate
      }
    })

    // Refresh config to get updated values
    await this.refreshConfig()
  }

  /**
   * Send a device command via HTTP API
   * @param {YotoDeviceCommand} command - Command to send
   * @returns {Promise<YotoDeviceCommandResponse>}
   */
  async sendCommand (command) {
    return await this.#client.sendDeviceCommand({
      deviceId: this.#state.device.deviceId,
      command
    })
  }

  // ==========================================================================
  // Private - MQTT Initialization
  // ==========================================================================

  /**
   * Initialize MQTT client and set up event handlers
   */
  async #initializeMqtt () {
    try {
      // Create MQTT client
      this.#mqttClient = await this.#client.createMqttClient({
        deviceId: this.#state.device.deviceId,
        mqttOptions: this.#options.mqttOptions
      })

      // Set up MQTT event handlers
      this.#setupMqttHandlers()

      // Connect to MQTT
      await this.#mqttClient.connect()
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', error)
      throw error
    }
  }

  /**
   * Set up MQTT event handlers
   */
  #setupMqttHandlers () {
    if (!this.#mqttClient) return

    // Connection events
    this.#mqttClient.on('connect', () => {
      this.emit('mqttConnect')

      // Request status and events after settling period
      this.#scheduleMqttRequests()
    })

    this.#mqttClient.on('disconnect', (metadata) => {
      this.#clearMqttRequestTimers()
      this.emit('mqttDisconnect', metadata)

      // Don't immediately mark as offline - MQTT may reconnect
      // Offline detection is based on lack of status updates, not connection state
    })

    this.#mqttClient.on('close', (metadata) => {
      this.#clearMqttRequestTimers()
      this.emit('mqttClose', metadata)

      // Don't immediately mark as offline - MQTT may reconnect
      // Offline detection is based on lack of status updates, not connection state
    })

    this.#mqttClient.on('reconnect', () => {
      this.emit('mqttReconnect')
    })

    this.#mqttClient.on('offline', () => {
      this.#clearMqttRequestTimers()
      this.emit('mqttOffline')
    })

    this.#mqttClient.on('end', () => {
      this.#clearMqttRequestTimers()
      this.emit('mqttEnd')
    })

    this.#mqttClient.on('error', (error) => {
      this.emit('error', error)
    })

    // Status updates - PRIMARY source for status after initialization
    this.#mqttClient.on('status', (_topic, message) => {
      this.#recordDeviceActivity()
      this.#updateStatusFromDocumentedMqtt(message.status)
    })

    // Legacy status updates - contains lifecycle events (shutdown/startup) and full hardware diagnostics
    // This does NOT respond to requestStatus() - only emits on real-time events or 5-minute periodic updates
    // NOTE: Don't call #recordDeviceActivity() here - #handleLegacyStatus handles online/offline transitions
    // based on actual power state (shutdown/startup) which is more reliable than just "activity"
    this.#mqttClient.on('status-legacy', (_topic, message) => {
      this.#handleLegacyStatus(message.status)
    })

    // Events updates (playback, volume, etc.)
    this.#mqttClient.on('events', (_topic, message) => {
      this.#recordDeviceActivity()
      this.#handleEventMessage(message)
    })

    // Response messages (for debugging/logging)
    this.#mqttClient.on('response', (_topic, _message) => {
      // Could emit these for command confirmation
      // For now just log internally
    })
  }

  /**
   * Schedule MQTT status and events requests after settling period
   */
  #scheduleMqttRequests () {
    // Clear any existing timers
    this.#clearMqttRequestTimers()

    // Request status after settling delay
    this.#statusRequestTimer = setTimeout(async () => {
      if (this.#mqttClient && this.#mqttClient.connected) {
        try {
          await this.#mqttClient.requestStatus()
        } catch (err) {
          const error = /** @type {Error} */ (err)
          this.emit('error', error)
        }
      }
    }, this.#mqttRequestStatusDelayMs)

    // Request events after longer delay
    this.#eventsRequestTimer = setTimeout(async () => {
      if (this.#mqttClient && this.#mqttClient.connected) {
        try {
          await this.#mqttClient.requestEvents()
        } catch (err) {
          const error = /** @type {Error} */ (err)
          this.emit('error', error)
        }
      }
    }, this.#mqttRequestEventsDelayMs)
  }

  /**
   * Clear MQTT request timers (status/events) after connect
   */
  #clearMqttRequestTimers () {
    if (this.#statusRequestTimer) {
      clearTimeout(this.#statusRequestTimer)
      this.#statusRequestTimer = null
    }

    if (this.#eventsRequestTimer) {
      clearTimeout(this.#eventsRequestTimer)
      this.#eventsRequestTimer = null
    }
  }

  /**
   * Stop background HTTP polling
   */
  #stopBackgroundPolling () {
    if (this.#backgroundPollTimer) {
      clearInterval(this.#backgroundPollTimer)
      this.#backgroundPollTimer = null
    }
  }

  /**
   * Clear all timers
   */
  #clearAllTimers () {
    this.#clearMqttRequestTimers()
    this.#stopBackgroundPolling()
  }

  // ==========================================================================
  // Private - Online/Offline Tracking
  // ==========================================================================

  /**
   * Record device activity (MQTT message received)
   * Marks device as online when MQTT messages are received
   * Does NOT mark online if device recently shut down (grace period of 10 seconds)
   */
  #recordDeviceActivity () {
    // If device was offline, check if we should mark it as online
    if (!this.#deviceOnline) {
      // Don't mark online from activity if shutdown was recently detected
      // MQTT messages can arrive after shutdown (queued messages, final status, etc.)
      // Only startup detection from legacy status should mark online after shutdown
      if (this.#shutdownDetectedAt !== null) {
        const timeSinceShutdown = Date.now() - this.#shutdownDetectedAt
        const gracePeriodMs = 10000 // 10 seconds
        if (timeSinceShutdown < gracePeriodMs) {
          // Ignore activity during grace period after shutdown
          return
        }
        // Grace period passed, clear shutdown timestamp
        this.#shutdownDetectedAt = null
      }

      this.#deviceOnline = true
      this.emit('online', { reason: 'activity' })
    }
  }

  /**
   * Start background HTTP polling for config+status sync
   * Runs every 10 minutes to keep device state synchronized via HTTP API
   */
  #startBackgroundPolling () {
    // Don't start if already running
    if (this.#backgroundPollTimer) {
      return
    }

    // Start polling at intervals (not immediately - we just fetched during start)
    this.#backgroundPollTimer = setInterval(() => {
      this.#backgroundPoll()
    }, this.#options.httpPollIntervalMs)
  }

  /**
   * Background HTTP poll - syncs device config, shortcuts, and status
   * Runs every 10 minutes to update state via HTTP API
   * Emits configUpdate and statusUpdate events, and offline event if device goes offline
   */
  async #backgroundPoll () {
    try {
      const configResponse = await this.#client.getDeviceConfig({
        deviceId: this.#state.device.deviceId
      })

      // Update config and shortcuts
      this.#updateConfigFromHttp(
        configResponse.device.config,
        configResponse.device.shortcuts
      )

      // Fetch and update status from status endpoint
      const statusResponse = await this.#client.getDeviceStatus({
        deviceId: this.#state.device.deviceId
      })
      this.#updateStatusFromStatusResponse(statusResponse)

      // Also update from full status if available in config response
      if (configResponse.device.status) {
        this.#updateStatusFromFullStatus(configResponse.device.status)
      }
    } catch (err) {
      // Log error but don't stop the timer - will retry on next interval
      const error = /** @type {Error} */ (err)
      this.emit('error', error)
    }
  }

  // ==========================================================================
  // Private - Status Normalization
  // ==========================================================================

  /**
   * Update internal status from HTTP full status (from config endpoint)
   * Uses exhaustive switch statement pattern to ensure all YotoDeviceFullStatus fields are handled.
   * @param {YotoDeviceFullStatus} fullStatus - Full status object from config endpoint
   */
  #updateStatusFromFullStatus (fullStatus) {
    let statusChanged = false
    let configChanged = false
    const wasOnline = this.#deviceOnline
    const { status, config } = this.#state
    /** @type {Set<keyof YotoDeviceStatus>} */
    const changedFields = new Set()
    /** @type {Set<keyof YotoDeviceConfig>} */
    const configChangedFields = new Set()

    /**
     * Handler function for each status field
     * @param {keyof YotoDeviceFullStatus} key
     * @param {YotoDeviceFullStatus} fullStatus
     */
    const handleField = (key, fullStatus) => {
      switch (key) {
        case 'activeCard': {
          const normalizedCard = fullStatus.activeCard === 'none' ? null : fullStatus.activeCard
          if (status.activeCardId !== normalizedCard) {
            status.activeCardId = normalizedCard
            changedFields.add('activeCardId')
            statusChanged = true
          }
          break
        }
        case 'aliveTime': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'als': {
          if (status.ambientLightSensorReading !== fullStatus.als) {
            status.ambientLightSensorReading = fullStatus.als
            changedFields.add('ambientLightSensorReading')
            statusChanged = true
          }
          break
        }
        case 'battery': {
          // Raw battery voltage - not stored in status (we use batteryLevel)
          break
        }
        case 'batteryLevel': {
          if (status.batteryLevelPercentage !== fullStatus.batteryLevel) {
            status.batteryLevelPercentage = fullStatus.batteryLevel
            changedFields.add('batteryLevelPercentage')
            statusChanged = true
          }
          break
        }
        case 'batteryLevelRaw': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryRemaining': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'bgDownload': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'bluetoothHp': {
          const isConnected = Boolean(fullStatus.bluetoothHp)
          if (status.isBluetoothAudioConnected !== isConnected) {
            status.isBluetoothAudioConnected = isConnected
            changedFields.add('isBluetoothAudioConnected')
            statusChanged = true
          }
          break
        }
        case 'buzzErrors': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'bytesPS': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'cardInserted': {
          const newState = convertCardInsertionState(fullStatus.cardInserted)
          if (status.cardInsertionState !== newState) {
            status.cardInsertionState = newState
            changedFields.add('cardInsertionState')
            statusChanged = true
          }
          break
        }
        case 'chgStatLevel': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'charging': {
          const isCharging = Boolean(fullStatus.charging)
          if (status.isCharging !== isCharging) {
            status.isCharging = isCharging
            changedFields.add('isCharging')
            statusChanged = true
          }
          break
        }
        case 'day': {
          const newDayMode = convertDayMode(fullStatus.day)
          if (status.dayMode !== newDayMode) {
            status.dayMode = newDayMode
            changedFields.add('dayMode')
            statusChanged = true
          }
          break
        }
        case 'dayBright': {
          if (fullStatus.dayBright !== null) {
            // HTTP fullStatus represents 'auto' brightness as 255
            const brightnessValue = fullStatus.dayBright === 255 ? 'auto' : String(fullStatus.dayBright)
            if (config.dayDisplayBrightness !== brightnessValue) {
              config.dayDisplayBrightness = brightnessValue
              configChangedFields.add('dayDisplayBrightness')
              configChanged = true
            }
          }
          break
        }
        case 'dbatTimeout': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'deviceId': {
          // Metadata field - not stored in status (stored in device)
          break
        }
        case 'dnowBrightness': {
          if (fullStatus.dnowBrightness !== null && status.displayBrightness !== fullStatus.dnowBrightness) {
            status.displayBrightness = fullStatus.dnowBrightness
            changedFields.add('displayBrightness')
            statusChanged = true
          }
          break
        }
        case 'errorsLogged': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'failData': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'failReason': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'free': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'free32': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'freeDisk': {
          if (status.freeDiskSpaceBytes !== fullStatus.freeDisk) {
            status.freeDiskSpaceBytes = fullStatus.freeDisk
            changedFields.add('freeDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'freeDMA': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'fwVersion': {
          if (status.firmwareVersion !== fullStatus.fwVersion) {
            status.firmwareVersion = fullStatus.fwVersion
            changedFields.add('firmwareVersion')
            statusChanged = true
          }
          break
        }
        case 'headphones': {
          const isConnected = Boolean(fullStatus.headphones)
          if (status.isAudioDeviceConnected !== isConnected) {
            status.isAudioDeviceConnected = isConnected
            changedFields.add('isAudioDeviceConnected')
            statusChanged = true
          }
          break
        }
        case 'lastSeenAt': {
          // Metadata field - not stored in status
          break
        }
        case 'missedLogs': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'nfcErrs': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'nfcLock': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'nightBright': {
          if (fullStatus.nightBright !== null) {
            // HTTP fullStatus represents 'auto' brightness as 255
            const brightnessValue = fullStatus.nightBright === 255 ? 'auto' : String(fullStatus.nightBright)
            if (config.nightDisplayBrightness !== brightnessValue) {
              config.nightDisplayBrightness = brightnessValue
              configChangedFields.add('nightDisplayBrightness')
              configChanged = true
            }
          }
          break
        }
        case 'nightlightMode': {
          // Skip updating from HTTP if value is '0x000000' or device is online
          // (HTTP returns inaccurate values; MQTT provides actual color)
          const shouldSkip = fullStatus.nightlightMode === '0x000000' || this.#deviceOnline
          if (!shouldSkip && status.nightlightMode !== fullStatus.nightlightMode) {
            status.nightlightMode = fullStatus.nightlightMode
            changedFields.add('nightlightMode')
            statusChanged = true
          }
          break
        }
        case 'playingStatus': {
          // Playback field - not stored in status
          break
        }
        case 'powerCaps': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'powerSrc': {
          const newPowerSource = convertPowerSource(fullStatus.powerSrc)
          if (status.powerSource !== newPowerSource) {
            status.powerSource = newPowerSource
            changedFields.add('powerSource')
            statusChanged = true
          }
          break
        }
        case 'qiOtp': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'sd_info': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'shutDown': {
          // Lifecycle field - not stored in status (handled by #handleLegacyStatus)
          break
        }
        case 'shutdownTimeout': {
          // Config field - not stored in status
          break
        }
        case 'ssid': {
          // Network field - not stored in status
          break
        }
        case 'statusVersion': {
          // Metadata field - not stored in status
          break
        }
        case 'temp': {
          const temperature = parseTemperature(fullStatus.temp)
          if (status.temperatureCelsius !== temperature) {
            status.temperatureCelsius = temperature
            changedFields.add('temperatureCelsius')
            statusChanged = true
          }
          break
        }
        case 'timeFormat': {
          if (fullStatus.timeFormat !== null && status.timeFormat !== fullStatus.timeFormat) {
            status.timeFormat = fullStatus.timeFormat
            changedFields.add('timeFormat')
            statusChanged = true
          }
          break
        }
        case 'totalDisk': {
          if (status.totalDiskSpaceBytes !== fullStatus.totalDisk) {
            status.totalDiskSpaceBytes = fullStatus.totalDisk
            changedFields.add('totalDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'twdt': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'updatedAt': {
          // Metadata field - handled separately below
          break
        }
        case 'upTime': {
          if (status.uptime !== fullStatus.upTime) {
            status.uptime = fullStatus.upTime
            changedFields.add('uptime')
            statusChanged = true
          }
          break
        }
        case 'userVolume': {
          // Convert from 0-100 percentage to 0-16 scale
          const volume = Math.round((fullStatus.userVolume / 100) * 16)
          if (status.volume !== volume) {
            status.volume = volume
            changedFields.add('volume')
            statusChanged = true
          }
          break
        }
        case 'utcOffset': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'utcTime': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'volume': {
          // Convert from 0-100 percentage to 0-16 scale
          const maxVolume = Math.round((fullStatus.volume / 100) * 16)
          if (status.maxVolume !== maxVolume) {
            status.maxVolume = maxVolume
            changedFields.add('maxVolume')
            statusChanged = true
          }
          break
        }
        case 'wifiRestarts': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'wifiStrength': {
          if (status.wifiStrength !== fullStatus.wifiStrength) {
            status.wifiStrength = fullStatus.wifiStrength
            changedFields.add('wifiStrength')
            statusChanged = true
          }
          break
        }
        default: {
          // This will cause a type error if a new key is added to YotoDeviceFullStatus
          // and not handled in the switch statement above
          /** @type {never} */
          // eslint-disable-next-line no-unused-expressions
          (key)
        }
      }
    }

    // Process all keys from fullStatus
    for (const key of typedKeys(fullStatus)) {
      handleField(key, fullStatus)
    }

    // Only emit if something actually changed
    if (statusChanged) {
      // Update metadata
      status.updatedAt = fullStatus.updatedAt ?? new Date().toISOString()
      status.source = 'http'

      this.#state.lastUpdate.status = Date.now()
      this.#state.lastUpdate.source = 'http'

      this.emit('statusUpdate', this.status, 'http', changedFields)
    }

    // Emit config update if config changed
    if (configChanged) {
      this.#state.lastUpdate.config = Date.now()

      this.emit('configUpdate', this.config, configChangedFields)
    }

    // Check if device went offline (transition from online to offline)
    if (wasOnline && !this.#deviceOnline) {
      this.emit('offline', { reason: 'http-status', source: 'http' })
    }
  }

  /**
   * Update internal status from HTTP status response (from status endpoint)
   * Uses exhaustive switch statement pattern to ensure all YotoDeviceStatusResponse fields are handled.
   * Called from start(), refreshConfig(), and background polling.
   * @param {YotoDeviceStatusResponse} statusResponse - Status response from status endpoint
   */
  #updateStatusFromStatusResponse (statusResponse) {
    let statusChanged = false
    const wasOnline = this.#deviceOnline
    const { status } = this.#state
    /** @type {Set<keyof YotoDeviceStatus>} */
    const changedFields = new Set()

    /**
     * Handler function for each status field
     * @param {keyof YotoDeviceStatusResponse} key
     * @param {YotoDeviceStatusResponse} statusResponse
     */
    const handleField = (key, statusResponse) => {
      switch (key) {
        case 'deviceId': {
          // Metadata field - not stored in status (stored in device)
          break
        }
        case 'activeCard': {
          const normalizedCard = statusResponse.activeCard === 'none' ? null : statusResponse.activeCard
          if (status.activeCardId !== normalizedCard) {
            status.activeCardId = normalizedCard
            changedFields.add('activeCardId')
            statusChanged = true
          }
          break
        }
        case 'ambientLightSensorReading': {
          if (status.ambientLightSensorReading !== statusResponse.ambientLightSensorReading) {
            status.ambientLightSensorReading = statusResponse.ambientLightSensorReading
            changedFields.add('ambientLightSensorReading')
            statusChanged = true
          }
          break
        }
        case 'averageDownloadSpeedBytesSecond': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryLevelPercentage': {
          if (status.batteryLevelPercentage !== statusResponse.batteryLevelPercentage) {
            status.batteryLevelPercentage = statusResponse.batteryLevelPercentage
            changedFields.add('batteryLevelPercentage')
            statusChanged = true
          }
          break
        }
        case 'batteryLevelPercentageRaw': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'buzzErrors': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'cardInsertionState': {
          const newState = convertCardInsertionState(statusResponse.cardInsertionState)
          if (status.cardInsertionState !== newState) {
            status.cardInsertionState = newState
            changedFields.add('cardInsertionState')
            statusChanged = true
          }
          break
        }
        case 'dayMode': {
          const newDayMode = convertDayMode(statusResponse.dayMode)
          if (status.dayMode !== newDayMode) {
            status.dayMode = newDayMode
            changedFields.add('dayMode')
            statusChanged = true
          }
          break
        }
        case 'errorsLogged': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'firmwareVersion': {
          if (status.firmwareVersion !== statusResponse.firmwareVersion) {
            status.firmwareVersion = statusResponse.firmwareVersion
            changedFields.add('firmwareVersion')
            statusChanged = true
          }
          break
        }
        case 'freeDiskSpaceBytes': {
          if (status.freeDiskSpaceBytes !== statusResponse.freeDiskSpaceBytes) {
            status.freeDiskSpaceBytes = statusResponse.freeDiskSpaceBytes
            changedFields.add('freeDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'isAudioDeviceConnected': {
          if (status.isAudioDeviceConnected !== statusResponse.isAudioDeviceConnected) {
            status.isAudioDeviceConnected = statusResponse.isAudioDeviceConnected
            changedFields.add('isAudioDeviceConnected')
            statusChanged = true
          }
          break
        }
        case 'isBackgroundDownloadActive': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'isBluetoothAudioConnected': {
          if (status.isBluetoothAudioConnected !== statusResponse.isBluetoothAudioConnected) {
            status.isBluetoothAudioConnected = statusResponse.isBluetoothAudioConnected
            changedFields.add('isBluetoothAudioConnected')
            statusChanged = true
          }
          break
        }
        case 'isCharging': {
          if (status.isCharging !== statusResponse.isCharging) {
            status.isCharging = statusResponse.isCharging
            changedFields.add('isCharging')
            statusChanged = true
          }
          break
        }
        case 'isNfcLocked': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'isOnline': {
          if (status.isOnline !== statusResponse.isOnline) {
            status.isOnline = statusResponse.isOnline
            changedFields.add('isOnline')
            statusChanged = true
          }
          break
        }
        case 'networkSsid': {
          // Network field - not stored in status
          break
        }
        case 'nightlightMode': {
          // Skip updating from HTTP if value is '0x000000' or device is online
          // (HTTP returns inaccurate values; MQTT provides actual color)
          const shouldSkip = statusResponse.nightlightMode === '0x000000' || this.#deviceOnline
          if (!shouldSkip && status.nightlightMode !== statusResponse.nightlightMode) {
            status.nightlightMode = statusResponse.nightlightMode
            changedFields.add('nightlightMode')
            statusChanged = true
          }
          break
        }
        case 'playingSource': {
          // Playback field - not stored in status
          break
        }
        case 'powerCapabilities': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'powerSource': {
          const newPowerSource = convertPowerSource(statusResponse.powerSource)
          if (status.powerSource !== newPowerSource) {
            status.powerSource = newPowerSource
            changedFields.add('powerSource')
            statusChanged = true
          }
          break
        }
        case 'systemVolumePercentage': {
          // Convert from 0-100 percentage to 0-16 scale
          const maxVolume = Math.round((statusResponse.systemVolumePercentage / 100) * 16)
          if (status.maxVolume !== maxVolume) {
            status.maxVolume = maxVolume
            changedFields.add('maxVolume')
            statusChanged = true
          }
          break
        }
        case 'taskWatchdogTimeoutCount': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'temperatureCelcius': {
          // API misspells "Celsius" as "Celcius"
          const temperature = parseTemperature(statusResponse.temperatureCelcius)
          if (status.temperatureCelsius !== temperature) {
            status.temperatureCelsius = temperature
            changedFields.add('temperatureCelsius')
            statusChanged = true
          }
          break
        }
        case 'totalDiskSpaceBytes': {
          if (status.totalDiskSpaceBytes !== statusResponse.totalDiskSpaceBytes) {
            status.totalDiskSpaceBytes = statusResponse.totalDiskSpaceBytes
            changedFields.add('totalDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'updatedAt': {
          // Metadata field - handled separately below
          break
        }
        case 'uptime': {
          if (status.uptime !== statusResponse.uptime) {
            status.uptime = statusResponse.uptime
            changedFields.add('uptime')
            statusChanged = true
          }
          break
        }
        case 'userVolumePercentage': {
          // Convert from 0-100 percentage to 0-16 scale
          const volume = Math.round((statusResponse.userVolumePercentage / 100) * 16)
          if (status.volume !== volume) {
            status.volume = volume
            changedFields.add('volume')
            statusChanged = true
          }
          break
        }
        case 'utcOffsetSeconds': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'wifiStrength': {
          if (status.wifiStrength !== statusResponse.wifiStrength) {
            status.wifiStrength = statusResponse.wifiStrength
            changedFields.add('wifiStrength')
            statusChanged = true
          }
          break
        }
        default: {
          // This will cause a type error if a new key is added to YotoDeviceStatusResponse
          // and not handled in the switch statement above
          /** @type {never} */
          // eslint-disable-next-line no-unused-expressions
          (key)
        }
      }
    }

    // Process all keys from statusResponse
    for (const key of typedKeys(statusResponse)) {
      handleField(key, statusResponse)
    }

    // Only emit if something actually changed
    if (statusChanged) {
      // Update metadata
      status.updatedAt = statusResponse.updatedAt ?? new Date().toISOString()
      status.source = 'http'

      this.#state.lastUpdate.status = Date.now()
      this.#state.lastUpdate.source = 'http'

      this.emit('statusUpdate', this.status, 'http', changedFields)
    }

    // Check if device went offline (transition from online to offline)
    if (wasOnline && !this.#deviceOnline) {
      this.emit('offline', { reason: 'http-status', source: 'http' })
    }
  }

  /**
   * Update config and shortcuts from HTTP API response
   *
   * @param {Readonly<YotoDeviceConfig>} configData - Config object from API (readonly)
   * @param {YotoDeviceShortcuts} [shortcutsData] - Shortcuts object from API
   */
  #updateConfigFromHttp (configData, shortcutsData) {
    let configChanged = false

    const { config } = this.#state
    /** @type {Set<keyof YotoDeviceConfig>} */
    const changedFields = new Set()

    /**
     * Handler function for each config field
     * @param {keyof YotoDeviceConfig} key
     * @param {YotoDeviceConfig} configData
     */
    const handleField = (key, configData) => {
      switch (key) {
        case 'alarms': {
          if (JSON.stringify(config.alarms) !== JSON.stringify(configData.alarms)) {
            config.alarms = configData.alarms
            changedFields.add('alarms')
            configChanged = true
          }
          break
        }
        case 'ambientColour': {
          if (config.ambientColour !== configData.ambientColour) {
            config.ambientColour = configData.ambientColour
            changedFields.add('ambientColour')
            configChanged = true
          }
          break
        }
        case 'bluetoothEnabled': {
          if (config.bluetoothEnabled !== configData.bluetoothEnabled) {
            config.bluetoothEnabled = configData.bluetoothEnabled
            changedFields.add('bluetoothEnabled')
            configChanged = true
          }
          break
        }
        case 'btHeadphonesEnabled': {
          if (config.btHeadphonesEnabled !== configData.btHeadphonesEnabled) {
            config.btHeadphonesEnabled = configData.btHeadphonesEnabled
            changedFields.add('btHeadphonesEnabled')
            configChanged = true
          }
          break
        }
        case 'clockFace': {
          if (config.clockFace !== configData.clockFace) {
            config.clockFace = configData.clockFace
            changedFields.add('clockFace')
            configChanged = true
          }
          break
        }
        case 'dayDisplayBrightness': {
          if (config.dayDisplayBrightness !== configData.dayDisplayBrightness) {
            config.dayDisplayBrightness = configData.dayDisplayBrightness
            changedFields.add('dayDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'dayTime': {
          if (config.dayTime !== configData.dayTime) {
            config.dayTime = configData.dayTime
            changedFields.add('dayTime')
            configChanged = true
          }
          break
        }
        case 'dayYotoDaily': {
          if (config.dayYotoDaily !== configData.dayYotoDaily) {
            config.dayYotoDaily = configData.dayYotoDaily
            changedFields.add('dayYotoDaily')
            configChanged = true
          }
          break
        }
        case 'dayYotoRadio': {
          if (config.dayYotoRadio !== configData.dayYotoRadio) {
            config.dayYotoRadio = configData.dayYotoRadio
            changedFields.add('dayYotoRadio')
            configChanged = true
          }
          break
        }
        case 'daySoundsOff': {
          if (config.daySoundsOff !== configData.daySoundsOff) {
            config.daySoundsOff = configData.daySoundsOff
            changedFields.add('daySoundsOff')
            configChanged = true
          }
          break
        }
        case 'displayDimBrightness': {
          if (config.displayDimBrightness !== configData.displayDimBrightness) {
            config.displayDimBrightness = configData.displayDimBrightness
            changedFields.add('displayDimBrightness')
            configChanged = true
          }
          break
        }
        case 'displayDimTimeout': {
          if (config.displayDimTimeout !== configData.displayDimTimeout) {
            config.displayDimTimeout = configData.displayDimTimeout
            changedFields.add('displayDimTimeout')
            configChanged = true
          }
          break
        }
        case 'headphonesVolumeLimited': {
          if (config.headphonesVolumeLimited !== configData.headphonesVolumeLimited) {
            config.headphonesVolumeLimited = configData.headphonesVolumeLimited
            changedFields.add('headphonesVolumeLimited')
            configChanged = true
          }
          break
        }
        case 'hourFormat': {
          if (config.hourFormat !== configData.hourFormat) {
            config.hourFormat = configData.hourFormat
            changedFields.add('hourFormat')
            configChanged = true
          }
          break
        }
        case 'locale': {
          if (config.locale !== configData.locale) {
            config.locale = configData.locale
            changedFields.add('locale')
            configChanged = true
          }
          break
        }
        case 'logLevel': {
          if (config.logLevel !== configData.logLevel) {
            config.logLevel = configData.logLevel
            changedFields.add('logLevel')
            configChanged = true
          }
          break
        }
        case 'maxVolumeLimit': {
          if (config.maxVolumeLimit !== configData.maxVolumeLimit) {
            config.maxVolumeLimit = configData.maxVolumeLimit
            changedFields.add('maxVolumeLimit')
            configChanged = true
          }
          break
        }
        case 'nightAmbientColour': {
          if (config.nightAmbientColour !== configData.nightAmbientColour) {
            config.nightAmbientColour = configData.nightAmbientColour
            changedFields.add('nightAmbientColour')
            configChanged = true
          }
          break
        }
        case 'nightDisplayBrightness': {
          if (config.nightDisplayBrightness !== configData.nightDisplayBrightness) {
            config.nightDisplayBrightness = configData.nightDisplayBrightness
            changedFields.add('nightDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'nightMaxVolumeLimit': {
          if (config.nightMaxVolumeLimit !== configData.nightMaxVolumeLimit) {
            config.nightMaxVolumeLimit = configData.nightMaxVolumeLimit
            changedFields.add('nightMaxVolumeLimit')
            configChanged = true
          }
          break
        }
        case 'nightTime': {
          if (config.nightTime !== configData.nightTime) {
            config.nightTime = configData.nightTime
            changedFields.add('nightTime')
            configChanged = true
          }
          break
        }
        case 'nightYotoDaily': {
          if (config.nightYotoDaily !== configData.nightYotoDaily) {
            config.nightYotoDaily = configData.nightYotoDaily
            changedFields.add('nightYotoDaily')
            configChanged = true
          }
          break
        }
        case 'nightYotoRadio': {
          if (config.nightYotoRadio !== configData.nightYotoRadio) {
            config.nightYotoRadio = configData.nightYotoRadio
            changedFields.add('nightYotoRadio')
            configChanged = true
          }
          break
        }
        case 'nightSoundsOff': {
          if (config.nightSoundsOff !== configData.nightSoundsOff) {
            config.nightSoundsOff = configData.nightSoundsOff
            changedFields.add('nightSoundsOff')
            configChanged = true
          }
          break
        }
        case 'pausePowerButton': {
          if (config.pausePowerButton !== configData.pausePowerButton) {
            config.pausePowerButton = configData.pausePowerButton
            changedFields.add('pausePowerButton')
            configChanged = true
          }
          break
        }
        case 'pauseVolumeDown': {
          if (config.pauseVolumeDown !== configData.pauseVolumeDown) {
            config.pauseVolumeDown = configData.pauseVolumeDown
            changedFields.add('pauseVolumeDown')
            configChanged = true
          }
          break
        }
        case 'repeatAll': {
          if (config.repeatAll !== configData.repeatAll) {
            config.repeatAll = configData.repeatAll
            changedFields.add('repeatAll')
            configChanged = true
          }
          break
        }
        case 'showDiagnostics': {
          if (config.showDiagnostics !== configData.showDiagnostics) {
            config.showDiagnostics = configData.showDiagnostics
            changedFields.add('showDiagnostics')
            configChanged = true
          }
          break
        }
        case 'shutdownTimeout': {
          if (config.shutdownTimeout !== configData.shutdownTimeout) {
            config.shutdownTimeout = configData.shutdownTimeout
            changedFields.add('shutdownTimeout')
            configChanged = true
          }
          break
        }
        case 'systemVolume': {
          if (config.systemVolume !== configData.systemVolume) {
            config.systemVolume = configData.systemVolume
            changedFields.add('systemVolume')
            configChanged = true
          }
          break
        }
        case 'timezone': {
          if (config.timezone !== configData.timezone) {
            config.timezone = configData.timezone
            changedFields.add('timezone')
            configChanged = true
          }
          break
        }
        case 'volumeLevel': {
          if (config.volumeLevel !== configData.volumeLevel) {
            config.volumeLevel = configData.volumeLevel
            changedFields.add('volumeLevel')
            configChanged = true
          }
          break
        }
        // eslint-disable-next-line no-unused-expressions
        default: { /** @type {never} */ (key) }
      }
    }

    // Process all keys from configData
    for (const key of typedKeys(configData)) {
      handleField(key, configData)
    }

    // Update shortcuts if provided
    if (shortcutsData) {
      const shortcutsStr = JSON.stringify(shortcutsData)
      const currentShortcutsStr = JSON.stringify(this.#state.shortcuts)
      if (shortcutsStr !== currentShortcutsStr) {
        this.#state.shortcuts = shortcutsData
        configChanged = true
      }
    }

    // Only emit if something actually changed
    if (configChanged) {
      this.#state.lastUpdate.config = Date.now()
      this.emit('configUpdate', this.config, changedFields)
    }
  }

  /**
   * Handle legacy status messages - contains lifecycle events and full hardware diagnostics
   * @param {YotoLegacyStatus} legacyStatus
   */
  #handleLegacyStatus (legacyStatus) {
    // Detect shutdown/startup lifecycle events using helper
    const powerState = detectPowerState(legacyStatus.shutDown, legacyStatus.upTime)

    if (powerState.state === 'startup') {
      // Device just started up
      if (!this.#deviceOnline) {
        this.#deviceOnline = true
        this.emit('online', { reason: 'startup', upTime: powerState.upTime })
      }
    } else if (powerState.state === 'shutdown') {
      // Device is shutting down or has shut down
      // Record shutdown time to prevent activity-based online marking
      this.#shutdownDetectedAt = Date.now()
      if (this.#deviceOnline) {
        this.#deviceOnline = false
        this.emit('offline', { reason: 'shutdown', shutDownReason: powerState.shutDownReason })
      }
      return // Don't process rest of status if device is shutting down
    }
    // else: state === 'running' - normal operation, continue processing

    // Update status with legacy data (which includes fields not in documented status)
    this.#updateStatusFromLegacyMqtt(legacyStatus)
  }

  /**
   * Update internal status from documented MQTT status message (/data/status)
   * Uses exhaustive switch statement pattern to ensure all YotoMqttStatus fields are handled.
   * @param {YotoMqttStatus} mqttStatus - MQTT status object from documented topic
   */
  #updateStatusFromDocumentedMqtt (mqttStatus) {
    let statusChanged = false
    let configChanged = false
    const { status, config } = this.#state
    /** @type {Set<keyof YotoDeviceStatus>} */
    const changedFields = new Set()
    /** @type {Set<keyof YotoDeviceConfig>} */
    const configChangedFields = new Set()

    /**
     * Handler function for each status field
     * @param {keyof YotoMqttStatus} key
     * @param {YotoMqttStatus} mqttStatus
     */
    const handleField = (key, mqttStatus) => {
      switch (key) {
        case 'statusVersion': {
          // Metadata field - not stored in status
          break
        }
        case 'fwVersion': {
          if (status.firmwareVersion !== mqttStatus.fwVersion) {
            status.firmwareVersion = mqttStatus.fwVersion
            changedFields.add('firmwareVersion')
            statusChanged = true
          }
          break
        }
        case 'productType': {
          // Metadata field - not stored in status
          break
        }
        case 'batteryLevel': {
          if (status.batteryLevelPercentage !== mqttStatus.batteryLevel) {
            status.batteryLevelPercentage = mqttStatus.batteryLevel
            changedFields.add('batteryLevelPercentage')
            statusChanged = true
          }
          break
        }
        case 'als': {
          if (status.ambientLightSensorReading !== mqttStatus.als) {
            status.ambientLightSensorReading = mqttStatus.als
            changedFields.add('ambientLightSensorReading')
            statusChanged = true
          }
          break
        }
        case 'freeDisk': {
          if (status.freeDiskSpaceBytes !== mqttStatus.freeDisk) {
            status.freeDiskSpaceBytes = mqttStatus.freeDisk
            changedFields.add('freeDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'shutdownTimeout': {
          // Config field - not stored in status
          break
        }
        case 'dbatTimeout': {
          // Hardware diagnostic field - not stored in status
          break
        }
        case 'charging': {
          const isCharging = Boolean(mqttStatus.charging)
          if (status.isCharging !== isCharging) {
            status.isCharging = isCharging
            changedFields.add('isCharging')
            statusChanged = true
          }
          break
        }
        case 'activeCard': {
          const normalizedCard = mqttStatus.activeCard === 'none' ? null : mqttStatus.activeCard
          if (status.activeCardId !== normalizedCard) {
            status.activeCardId = normalizedCard
            changedFields.add('activeCardId')
            statusChanged = true
          }
          break
        }
        case 'cardInserted': {
          const newState = convertCardInsertionState(mqttStatus.cardInserted)
          if (status.cardInsertionState !== newState) {
            status.cardInsertionState = newState
            changedFields.add('cardInsertionState')
            statusChanged = true
          }
          break
        }
        case 'playingStatus': {
          // Playback field - not stored in status
          break
        }
        case 'headphones': {
          const isConnected = Boolean(mqttStatus.headphones)
          if (status.isAudioDeviceConnected !== isConnected) {
            status.isAudioDeviceConnected = isConnected
            changedFields.add('isAudioDeviceConnected')
            statusChanged = true
          }
          break
        }
        case 'dnowBrightness': {
          if (status.displayBrightness !== mqttStatus.dnowBrightness) {
            status.displayBrightness = mqttStatus.dnowBrightness
            changedFields.add('displayBrightness')
            statusChanged = true
          }
          break
        }
        case 'dayBright': {
          // MQTT represents 'auto' brightness as 255
          const brightnessValue = mqttStatus.dayBright === 255 ? 'auto' : String(mqttStatus.dayBright)
          if (config.dayDisplayBrightness !== brightnessValue) {
            config.dayDisplayBrightness = brightnessValue
            configChangedFields.add('dayDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'nightBright': {
          // MQTT represents 'auto' brightness as 255
          const brightnessValue = mqttStatus.nightBright === 255 ? 'auto' : String(mqttStatus.nightBright)
          if (config.nightDisplayBrightness !== brightnessValue) {
            config.nightDisplayBrightness = brightnessValue
            configChangedFields.add('nightDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'bluetoothHp': {
          const isConnected = Boolean(mqttStatus.bluetoothHp)
          if (status.isBluetoothAudioConnected !== isConnected) {
            status.isBluetoothAudioConnected = isConnected
            changedFields.add('isBluetoothAudioConnected')
            statusChanged = true
          }
          break
        }
        case 'volume': {
          // Convert from 0-100 percentage to 0-16 scale
          const maxVolume = Math.round((mqttStatus.volume / 100) * 16)
          if (status.maxVolume !== maxVolume) {
            status.maxVolume = maxVolume
            changedFields.add('maxVolume')
            statusChanged = true
          }
          break
        }
        case 'userVolume': {
          // Convert from 0-100 percentage to 0-16 scale
          const volume = Math.round((mqttStatus.userVolume / 100) * 16)
          if (status.volume !== volume) {
            status.volume = volume
            changedFields.add('volume')
            statusChanged = true
          }
          break
        }
        case 'timeFormat': {
          if (status.timeFormat !== mqttStatus.timeFormat) {
            status.timeFormat = mqttStatus.timeFormat
            changedFields.add('timeFormat')
            statusChanged = true
          }
          break
        }
        case 'nightlightMode': {
          if (mqttStatus.nightlightMode !== undefined && status.nightlightMode !== mqttStatus.nightlightMode) {
            status.nightlightMode = mqttStatus.nightlightMode
            changedFields.add('nightlightMode')
            statusChanged = true
          }
          break
        }
        case 'temp': {
          if (mqttStatus.temp !== undefined) {
            const temperature = parseTemperature(mqttStatus.temp)
            if (status.temperatureCelsius !== temperature) {
              status.temperatureCelsius = temperature
              changedFields.add('temperatureCelsius')
              statusChanged = true
            }
          }
          break
        }
        case 'day': {
          const newDayMode = convertDayMode(mqttStatus.day)
          if (status.dayMode !== newDayMode) {
            status.dayMode = newDayMode
            changedFields.add('dayMode')
            statusChanged = true
          }
          break
        }
        default: {
          // This will cause a type error if a new key is added to YotoMqttStatus
          // and not handled in the switch statement above
          /** @type {never} */
          // eslint-disable-next-line no-unused-expressions
          (key)
        }
      }
    }

    // Process all keys from mqttStatus
    for (const key of typedKeys(mqttStatus)) {
      handleField(key, mqttStatus)
    }

    // Only emit if something actually changed
    if (statusChanged) {
      // Update metadata
      this.#deviceOnline = true // If we're getting MQTT, device is online
      status.updatedAt = new Date().toISOString()
      status.source = 'mqtt'
      this.#state.lastUpdate.status = Date.now()
      this.#state.lastUpdate.source = 'mqtt'

      this.emit('statusUpdate', this.status, 'mqtt', changedFields)
    }

    // Emit config update if config changed
    if (configChanged) {
      this.#state.lastUpdate.config = Date.now()

      this.emit('configUpdate', this.config, configChangedFields)
    }
  }

  /**
   * Update internal status from legacy MQTT status message (/status)
   * Uses exhaustive switch statement pattern to ensure all YotoLegacyStatus fields are handled.
   * Legacy status includes fields not in documented status (wifiStrength, totalDisk, powerSrc, upTime, etc.)
   * @param {YotoLegacyStatus} legacyStatus - Legacy MQTT status object
   */
  #updateStatusFromLegacyMqtt (legacyStatus) {
    let statusChanged = false
    let configChanged = false
    const { status, config } = this.#state
    /** @type {Set<keyof YotoDeviceStatus>} */
    const changedFields = new Set()
    /** @type {Set<keyof YotoDeviceConfig>} */
    const configChangedFields = new Set()

    /**
     * Handler function for each legacy status field
     * @param {keyof YotoLegacyStatus} key
     * @param {YotoLegacyStatus} legacyStatus
     */
    const handleField = (key, legacyStatus) => {
      switch (key) {
        case 'statusVersion': {
          // Metadata field - not stored in status
          break
        }
        case 'fwVersion': {
          if (status.firmwareVersion !== legacyStatus.fwVersion) {
            status.firmwareVersion = legacyStatus.fwVersion
            changedFields.add('firmwareVersion')
            statusChanged = true
          }
          break
        }
        case 'shutDown': {
          // Handled by #handleLegacyStatus for lifecycle events - not stored in status
          break
        }
        case 'totalDisk': {
          if (status.totalDiskSpaceBytes !== legacyStatus.totalDisk) {
            status.totalDiskSpaceBytes = legacyStatus.totalDisk
            changedFields.add('totalDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'productType': {
          // Metadata field - not stored in status
          break
        }
        case 'wifiStrength': {
          if (status.wifiStrength !== legacyStatus.wifiStrength) {
            status.wifiStrength = legacyStatus.wifiStrength
            changedFields.add('wifiStrength')
            statusChanged = true
          }
          break
        }
        case 'ssid': {
          // WiFi SSID - not currently stored in status
          break
        }
        case 'rtcResetReasonPRO': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'rtcResetReasonAPP': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'rtcWakeupCause': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'espResetReason': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'sd_info': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'battery': {
          // Raw battery voltage - not stored in status (we use batteryLevel)
          break
        }
        case 'powerCaps': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryLevel': {
          if (status.batteryLevelPercentage !== legacyStatus.batteryLevel) {
            status.batteryLevelPercentage = legacyStatus.batteryLevel
            changedFields.add('batteryLevelPercentage')
            statusChanged = true
          }
          break
        }
        case 'batteryTemp': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryData': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryLevelRaw': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'free': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'freeDMA': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'free32': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'upTime': {
          if (status.uptime !== legacyStatus.upTime) {
            status.uptime = legacyStatus.upTime
            changedFields.add('uptime')
            statusChanged = true
          }
          break
        }
        case 'utcTime': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'aliveTime': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'accelTemp': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryProfile': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'freeDisk': {
          if (status.freeDiskSpaceBytes !== legacyStatus.freeDisk) {
            status.freeDiskSpaceBytes = legacyStatus.freeDisk
            changedFields.add('freeDiskSpaceBytes')
            statusChanged = true
          }
          break
        }
        case 'failReason': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'failData': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'shutdownTimeout': {
          // Config field - not stored in status
          break
        }
        case 'utcOffset': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'nfcErrs': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'dbatTimeout': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'charging': {
          const isCharging = Boolean(legacyStatus.charging)
          if (status.isCharging !== isCharging) {
            status.isCharging = isCharging
            changedFields.add('isCharging')
            statusChanged = true
          }
          break
        }
        case 'powerSrc': {
          const newPowerSource = convertPowerSource(legacyStatus.powerSrc)
          if (status.powerSource !== newPowerSource) {
            status.powerSource = newPowerSource
            changedFields.add('powerSource')
            statusChanged = true
          }
          break
        }
        case 'activeCard': {
          const normalizedCard = legacyStatus.activeCard === 'none' ? null : legacyStatus.activeCard
          if (status.activeCardId !== normalizedCard) {
            status.activeCardId = normalizedCard
            changedFields.add('activeCardId')
            statusChanged = true
          }
          break
        }
        case 'cardInserted': {
          const newState = convertCardInsertionState(legacyStatus.cardInserted)
          if (status.cardInsertionState !== newState) {
            status.cardInsertionState = newState
            changedFields.add('cardInsertionState')
            statusChanged = true
          }
          break
        }
        case 'playingStatus': {
          // Playback field - not stored in status
          break
        }
        case 'headphones': {
          const isConnected = Boolean(legacyStatus.headphones)
          if (status.isAudioDeviceConnected !== isConnected) {
            status.isAudioDeviceConnected = isConnected
            changedFields.add('isAudioDeviceConnected')
            statusChanged = true
          }
          break
        }
        case 'wifiRestarts': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'qiOtp': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'buzzErrors': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'dnowBrightness': {
          if (status.displayBrightness !== legacyStatus.dnowBrightness) {
            status.displayBrightness = legacyStatus.dnowBrightness
            changedFields.add('displayBrightness')
            statusChanged = true
          }
          break
        }
        case 'dayBright': {
          // MQTT represents 'auto' brightness as 255
          const brightnessValue = legacyStatus.dayBright === 255 ? 'auto' : String(legacyStatus.dayBright)
          if (config.dayDisplayBrightness !== brightnessValue) {
            config.dayDisplayBrightness = brightnessValue
            configChangedFields.add('dayDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'nightBright': {
          // MQTT represents 'auto' brightness as 255
          const brightnessValue = legacyStatus.nightBright === 255 ? 'auto' : String(legacyStatus.nightBright)
          if (config.nightDisplayBrightness !== brightnessValue) {
            config.nightDisplayBrightness = brightnessValue
            configChangedFields.add('nightDisplayBrightness')
            configChanged = true
          }
          break
        }
        case 'errorsLogged': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'twdt': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'bluetoothHp': {
          const isConnected = Boolean(legacyStatus.bluetoothHp)
          if (status.isBluetoothAudioConnected !== isConnected) {
            status.isBluetoothAudioConnected = isConnected
            changedFields.add('isBluetoothAudioConnected')
            statusChanged = true
          }
          break
        }
        case 'nightlightMode': {
          if (status.nightlightMode !== legacyStatus.nightlightMode) {
            status.nightlightMode = legacyStatus.nightlightMode
            changedFields.add('nightlightMode')
            statusChanged = true
          }
          break
        }
        case 'bgDownload': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'bytesPS': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'day': {
          const newDayMode = convertDayMode(legacyStatus.day)
          if (status.dayMode !== newDayMode) {
            status.dayMode = newDayMode
            changedFields.add('dayMode')
            statusChanged = true
          }
          break
        }
        case 'temp': {
          const temperature = parseTemperature(legacyStatus.temp)
          if (status.temperatureCelsius !== temperature) {
            status.temperatureCelsius = temperature
            changedFields.add('temperatureCelsius')
            statusChanged = true
          }
          break
        }
        case 'als': {
          if (status.ambientLightSensorReading !== legacyStatus.als) {
            status.ambientLightSensorReading = legacyStatus.als
            changedFields.add('ambientLightSensorReading')
            statusChanged = true
          }
          break
        }
        case 'volume': {
          // Convert from 0-100 percentage to 0-16 scale
          const maxVolume = Math.round((legacyStatus.volume / 100) * 16)
          if (status.maxVolume !== maxVolume) {
            status.maxVolume = maxVolume
            changedFields.add('maxVolume')
            statusChanged = true
          }
          break
        }
        case 'userVolume': {
          // Convert from 0-100 percentage to 0-16 scale
          const volume = Math.round((legacyStatus.userVolume / 100) * 16)
          if (status.volume !== volume) {
            status.volume = volume
            changedFields.add('volume')
            statusChanged = true
          }
          break
        }
        case 'timeFormat': {
          if (status.timeFormat !== legacyStatus.timeFormat) {
            status.timeFormat = legacyStatus.timeFormat
            changedFields.add('timeFormat')
            statusChanged = true
          }
          break
        }
        case 'chgStatLevel': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'missedLogs': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'nfcLock': {
          // Hardware diagnostic - not stored in status
          break
        }
        case 'batteryFullPct': {
          // Hardware diagnostic - not stored in status
          break
        }
        default: {
          // This will cause a type error if a new key is added to YotoLegacyStatus
          // and not handled in the switch statement above
          /** @type {never} */
          // eslint-disable-next-line no-unused-expressions
          (key)
        }
      }
    }

    // Process all keys from legacyStatus
    for (const key of typedKeys(legacyStatus)) {
      handleField(key, legacyStatus)
    }

    // Only emit if something actually changed
    if (statusChanged) {
      // Update metadata
      this.#deviceOnline = true // If we're getting MQTT, device is online
      status.updatedAt = new Date().toISOString()
      status.source = 'mqtt'

      this.#state.lastUpdate.status = Date.now()
      this.#state.lastUpdate.source = 'mqtt'

      this.emit('statusUpdate', this.status, 'mqtt', changedFields)
    }

    // Emit config update if config changed
    if (configChanged) {
      this.#state.lastUpdate.config = Date.now()

      this.emit('configUpdate', this.config, configChangedFields)
    }
  }

  /**
   * Handle MQTT event message - updates status, config, and playback
   * Events are partial updates - only changed fields are included
   * Uses exhaustive switch statement pattern to ensure all YotoEventsMessage fields are handled.
   *
   * Event fields are categorized as:
   * - STATUS: volume
   * - CONFIG: repeatAll, volumeMax
   * - PLAYBACK: streaming, sleepTimerActive, sleepTimerSeconds, trackLength,
   *             position, cardId, source, playbackStatus, chapterTitle, chapterKey,
   *             trackTitle, trackKey
   * - METADATA: eventUtc, cardUpdatedAt, playbackWait (not currently stored)
   *
   * @param {YotoEventsMessage} eventsMessage - MQTT events message
   */
  #handleEventMessage (eventsMessage) {
    let statusChanged = false
    let configChanged = false
    let playbackChanged = false

    const { status, config, playback } = this.#state
    /** @type {Set<keyof YotoDeviceStatus>} */
    const statusChangedFields = new Set()
    /** @type {Set<keyof YotoDeviceConfig>} */
    const configChangedFields = new Set()
    /** @type {Set<keyof YotoPlaybackState>} */
    const playbackChangedFields = new Set()

    /**
     * Handler function for each event field
     * @param {keyof YotoEventsMessage} key
     * @param {YotoEventsMessage} eventsMessage
     */
    const handleField = (key, eventsMessage) => {
      switch (key) {
        case 'volume': {
          if (eventsMessage.volume !== undefined && status.volume !== eventsMessage.volume) {
            status.volume = eventsMessage.volume
            status.updatedAt = new Date().toISOString()
            statusChangedFields.add('volume')
            statusChanged = true
          }
          break
        }
        case 'repeatAll': {
          if (config && eventsMessage.repeatAll !== undefined && config.repeatAll !== eventsMessage.repeatAll) {
            config.repeatAll = eventsMessage.repeatAll
            configChangedFields.add('repeatAll')
            configChanged = true
          }
          break
        }
        case 'volumeMax': {
          // volumeMax is the current effective max volume limit (config-derived)
          // Store as string to match config type (maxVolumeLimit is string)
          if (eventsMessage.volumeMax !== undefined && status.maxVolume !== eventsMessage.volumeMax) {
            status.maxVolume = eventsMessage.volumeMax
            statusChangedFields.add('maxVolume')
            statusChanged = true
          }
          break
        }
        case 'streaming': {
          if (eventsMessage.streaming !== undefined && playback.streaming !== eventsMessage.streaming) {
            playback.streaming = eventsMessage.streaming
            playbackChangedFields.add('streaming')
            playbackChanged = true
          }
          break
        }
        case 'sleepTimerActive': {
          if (eventsMessage.sleepTimerActive !== undefined && playback.sleepTimerActive !== eventsMessage.sleepTimerActive) {
            playback.sleepTimerActive = eventsMessage.sleepTimerActive
            playbackChangedFields.add('sleepTimerActive')
            playbackChanged = true
          }
          break
        }
        case 'sleepTimerSeconds': {
          if (eventsMessage.sleepTimerSeconds !== undefined && playback.sleepTimerSeconds !== eventsMessage.sleepTimerSeconds) {
            playback.sleepTimerSeconds = eventsMessage.sleepTimerSeconds
            playbackChangedFields.add('sleepTimerSeconds')
            playbackChanged = true
          }
          break
        }
        case 'trackLength': {
          if (eventsMessage.trackLength !== undefined && playback.trackLength !== eventsMessage.trackLength) {
            playback.trackLength = eventsMessage.trackLength
            playbackChangedFields.add('trackLength')
            playbackChanged = true
          }
          break
        }
        case 'position': {
          if (eventsMessage.position !== undefined && playback.position !== eventsMessage.position) {
            playback.position = eventsMessage.position
            playbackChangedFields.add('position')
            playbackChanged = true
          }
          break
        }
        case 'cardId': {
          if (eventsMessage.cardId !== undefined && playback.cardId !== eventsMessage.cardId) {
            playback.cardId = eventsMessage.cardId
            playbackChangedFields.add('cardId')
            playbackChanged = true
          }
          break
        }
        case 'source': {
          if (eventsMessage.source !== undefined && playback.source !== eventsMessage.source) {
            playback.source = eventsMessage.source
            playbackChangedFields.add('source')
            playbackChanged = true
          }
          break
        }
        case 'playbackStatus': {
          if (eventsMessage.playbackStatus !== undefined && playback.playbackStatus !== eventsMessage.playbackStatus) {
            playback.playbackStatus = eventsMessage.playbackStatus
            playbackChangedFields.add('playbackStatus')
            playbackChanged = true
          }
          break
        }
        case 'chapterTitle': {
          if (eventsMessage.chapterTitle !== undefined && playback.chapterTitle !== eventsMessage.chapterTitle) {
            playback.chapterTitle = eventsMessage.chapterTitle
            playbackChangedFields.add('chapterTitle')
            playbackChanged = true
          }
          break
        }
        case 'chapterKey': {
          if (eventsMessage.chapterKey !== undefined && playback.chapterKey !== eventsMessage.chapterKey) {
            playback.chapterKey = eventsMessage.chapterKey
            playbackChangedFields.add('chapterKey')
            playbackChanged = true
          }
          break
        }
        case 'trackTitle': {
          if (eventsMessage.trackTitle !== undefined && playback.trackTitle !== eventsMessage.trackTitle) {
            playback.trackTitle = eventsMessage.trackTitle
            playbackChangedFields.add('trackTitle')
            playbackChanged = true
          }
          break
        }
        case 'trackKey': {
          if (eventsMessage.trackKey !== undefined && playback.trackKey !== eventsMessage.trackKey) {
            playback.trackKey = eventsMessage.trackKey
            playbackChangedFields.add('trackKey')
            playbackChanged = true
          }
          break
        }
        case 'playbackWait': {
          // Not currently stored - metadata only
          break
        }
        case 'eventUtc': {
          // Not currently stored - metadata only
          break
        }
        case 'cardUpdatedAt': {
          // Not currently stored - metadata only
          break
        }
        default: {
          // This will cause a type error if a new key is added to YotoEventsMessage
          // and not handled in the switch statement above
          /** @type {never} */
          // eslint-disable-next-line no-unused-expressions
          (key)
        }
      }
    }

    // Process all keys from eventsMessage
    for (const key of typedKeys(eventsMessage)) {
      handleField(key, eventsMessage)
    }

    // Update timestamps and emit events for changed categories
    if (statusChanged) {
      this.#state.lastUpdate.status = Date.now()
      this.#state.lastUpdate.source = 'mqtt-event'
      this.emit('statusUpdate', this.status, 'mqtt-event', statusChangedFields)
    }

    if (configChanged) {
      this.#state.lastUpdate.config = Date.now()
      this.emit('configUpdate', this.config, configChangedFields)
    }

    if (playbackChanged) {
      playback.updatedAt = new Date().toISOString()
      this.#state.lastUpdate.playback = Date.now()
      this.emit('playbackUpdate', this.playback, playbackChangedFields)
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty playback state object
 * @returns {YotoPlaybackState}
 */
function createEmptyPlaybackState () {
  return {
    cardId: null,
    source: null,
    playbackStatus: null,
    trackTitle: null,
    trackKey: null,
    chapterTitle: null,
    chapterKey: null,
    position: null,
    trackLength: null,
    streaming: null,
    sleepTimerActive: null,
    sleepTimerSeconds: null,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Create an empty device config object
 * @returns {YotoDeviceConfig}
 */
function createEmptyDeviceConfig () {
  return {
    alarms: [],
    ambientColour: '#000000',
    bluetoothEnabled: '0',
    btHeadphonesEnabled: false,
    clockFace: 'digital-sun',
    dayDisplayBrightness: 'auto',
    dayTime: '07:00',
    dayYotoDaily: '',
    dayYotoRadio: '',
    daySoundsOff: '0',
    displayDimBrightness: '0',
    displayDimTimeout: '30',
    headphonesVolumeLimited: false,
    hourFormat: '12',
    locale: 'en',
    logLevel: 'none',
    maxVolumeLimit: '16',
    nightAmbientColour: '#000000',
    nightDisplayBrightness: 'auto',
    nightMaxVolumeLimit: '10',
    nightTime: '19:00',
    nightYotoDaily: '',
    nightYotoRadio: '',
    nightSoundsOff: '0',
    pausePowerButton: false,
    pauseVolumeDown: false,
    repeatAll: false,
    showDiagnostics: false,
    shutdownTimeout: '900',
    systemVolume: '100',
    timezone: '',
    volumeLevel: 'safe'
  }
}

/**
 * Create an empty device shortcuts object
 * @returns {YotoDeviceShortcuts}
 */
function createEmptyDeviceShortcuts () {
  return {
    modes: {
      day: {
        content: []
      },
      night: {
        content: []
      }
    },
    versionId: ''
  }
}

/**
 * Create an empty device status object
 * @param {YotoDevice} [device] - Device object to initialize from
 * @returns {YotoDeviceStatus}
 */
function createEmptyDeviceStatus (device) {
  return {
    activeCardId: null,
    batteryLevelPercentage: 0,
    isCharging: false,
    isOnline: device?.online ?? false,
    volume: 0,
    maxVolume: 16,
    cardInsertionState: 'none',
    dayMode: convertDayMode(-1),
    powerSource: convertPowerSource(0),
    firmwareVersion: '',
    wifiStrength: 0,
    freeDiskSpaceBytes: 0,
    totalDiskSpaceBytes: 0,
    isAudioDeviceConnected: false,
    isBluetoothAudioConnected: false,
    nightlightMode: 'off',
    temperatureCelsius: null,
    ambientLightSensorReading: 0,
    displayBrightness: null,
    timeFormat: null,
    uptime: 0,
    updatedAt: new Date().toISOString(),
    source: 'http'
  }
}

/**
 * Sleep for a specified amount of time
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
