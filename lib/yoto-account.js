/**
 * @import { YotoClientConstructorOptions } from './api-client.js'
 * @import { YotoDeviceModelOptions, YotoDeviceModelConfig, YotoDeviceStatus, YotoDeviceOnlineMetadata, YotoDeviceOfflineMetadata, YotoPlaybackState, YotoMqttConnectMetadata, YotoMqttDisconnectMetadata, YotoMqttCloseMetadata } from './yoto-device.js'
 * @import { YotoEventsMessage, YotoStatusMessage, YotoStatusLegacyMessage, YotoResponseMessage } from './mqtt/client.js'
 */

import { EventEmitter } from 'events'
import { YotoClient } from './api-client.js'
import { YotoDeviceModel } from './yoto-device.js'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Yoto Account initialization options
 * @typedef {Object} YotoAccountOptions
 * @property {YotoClientConstructorOptions} clientOptions - Yoto API client Options
 * @property {YotoDeviceModelOptions} deviceOptions - Yoto Device Model Options
 */

/**
 * Error context information
 * @typedef {Object} YotoAccountErrorContext
 * @property {string} source - Error source ('account', 'client', or deviceId)
 * @property {string} [deviceId] - Device ID if error is device-specific
 * @property {string} [operation] - Operation that failed
 */

/**
 * Started event metadata
 * @typedef {Object} YotoAccountStartedMetadata
 * @property {number} deviceCount - Number of devices managed
 * @property {string[]} devices - Array of device IDs
 */

/**
 * Device event wrapper
 * @template T
 * @typedef {{ deviceId: string } & T} YotoAccountDeviceEvent
 */

/**
 * Device added event data
 * @typedef {YotoAccountDeviceEvent<{}>} YotoAccountDeviceAddedEvent
 */

/**
 * Device removed event data
 * @typedef {YotoAccountDeviceEvent<{}>} YotoAccountDeviceRemovedEvent
 */

/**
 * Device status update event data
 * @typedef {YotoAccountDeviceEvent<{
 *   status: YotoDeviceStatus,
 *   source: string,
 *   changedFields: Set<keyof YotoDeviceStatus>
 * }>} YotoAccountStatusUpdateEvent
 */

/**
 * Device config update event data
 * @typedef {YotoAccountDeviceEvent<{
 *   config: YotoDeviceModelConfig,
 *   changedFields: Set<keyof YotoDeviceModelConfig>
 * }>} YotoAccountConfigUpdateEvent
 */

/**
 * Device playback update event data
 * @typedef {YotoAccountDeviceEvent<{
 *   playback: YotoPlaybackState,
 *   changedFields: Set<keyof YotoPlaybackState>
 * }>} YotoAccountPlaybackUpdateEvent
 */

/**
 * Device online event data
 * @typedef {YotoAccountDeviceEvent<{
 *   metadata: YotoDeviceOnlineMetadata
 * }>} YotoAccountOnlineEvent
 */

/**
 * Device offline event data
 * @typedef {YotoAccountDeviceEvent<{
 *   metadata: YotoDeviceOfflineMetadata
 * }>} YotoAccountOfflineEvent
 */

/**
 * MQTT connect event data
 * @typedef {YotoAccountDeviceEvent<{
 *   metadata: YotoMqttConnectMetadata
 * }>} YotoAccountMqttConnectEvent
 */

/**
 * MQTT disconnect event data
 * @typedef {YotoAccountDeviceEvent<{
 *   metadata: YotoMqttDisconnectMetadata
 * }>} YotoAccountMqttDisconnectEvent
 */

/**
 * MQTT close event data
 * @typedef {YotoAccountDeviceEvent<{
 *   metadata: YotoMqttCloseMetadata
 * }>} YotoAccountMqttCloseEvent
 */

/**
 * MQTT reconnect event data
 * @typedef {YotoAccountDeviceEvent<{}>} YotoAccountMqttReconnectEvent
 */

/**
 * MQTT offline event data
 * @typedef {YotoAccountDeviceEvent<{}>} YotoAccountMqttOfflineEvent
 */

/**
 * MQTT end event data
 * @typedef {YotoAccountDeviceEvent<{}>} YotoAccountMqttEndEvent
 */

/**
 * MQTT status event data
 * @typedef {YotoAccountDeviceEvent<{
 *   topic: string,
 *   message: YotoStatusMessage
 * }>} YotoAccountMqttStatusEvent
 */

/**
 * MQTT events event data
 * @typedef {YotoAccountDeviceEvent<{
 *   topic: string,
 *   message: YotoEventsMessage
 * }>} YotoAccountMqttEventsEvent
 */

/**
 * MQTT legacy status event data
 * @typedef {YotoAccountDeviceEvent<{
 *   topic: string,
 *   message: YotoStatusLegacyMessage
 * }>} YotoAccountMqttStatusLegacyEvent
 */

/**
 * MQTT response event data
 * @typedef {YotoAccountDeviceEvent<{
 *   topic: string,
 *   message: YotoResponseMessage
 * }>} YotoAccountMqttResponseEvent
 */

/**
 * MQTT unknown event data
 * @typedef {YotoAccountDeviceEvent<{
 *   topic: string,
 *   message: unknown
 * }>} YotoAccountMqttUnknownEvent
 */

/**
 * Account error event data
 * @typedef {Object} YotoAccountErrorEvent
 * @property {Error} error - Error instance
 * @property {YotoAccountErrorContext} context - Error context
 */

/**
 * Device event handler set
 * @typedef {Object} YotoAccountDeviceEventHandlers
 * @property {(status: YotoDeviceStatus, source: string, changedFields: Set<keyof YotoDeviceStatus>) => void} statusUpdate
 * @property {(config: YotoDeviceModelConfig, changedFields: Set<keyof YotoDeviceModelConfig>) => void} configUpdate
 * @property {(playback: YotoPlaybackState, changedFields: Set<keyof YotoPlaybackState>) => void} playbackUpdate
 * @property {(metadata: YotoDeviceOnlineMetadata) => void} online
 * @property {(metadata: YotoDeviceOfflineMetadata) => void} offline
 * @property {(metadata: YotoMqttConnectMetadata) => void} mqttConnect
 * @property {(metadata: YotoMqttDisconnectMetadata) => void} mqttDisconnect
 * @property {(metadata: YotoMqttCloseMetadata) => void} mqttClose
 * @property {() => void} mqttReconnect
 * @property {() => void} mqttOffline
 * @property {() => void} mqttEnd
 * @property {(topic: string, message: YotoStatusMessage) => void} mqttStatus
 * @property {(topic: string, message: YotoEventsMessage) => void} mqttEvents
 * @property {(topic: string, message: YotoStatusLegacyMessage) => void} mqttStatusLegacy
 * @property {(topic: string, message: YotoResponseMessage) => void} mqttResponse
 * @property {(topic: string, message: unknown) => void} mqttUnknown
 */

/**
 * Event map for YotoAccount
 * @typedef {{
 *   'started': [YotoAccountStartedMetadata],
 *   'stopped': [],
 *   'deviceAdded': [YotoAccountDeviceAddedEvent],
 *   'deviceRemoved': [YotoAccountDeviceRemovedEvent],
 *   'statusUpdate': [YotoAccountStatusUpdateEvent],
 *   'configUpdate': [YotoAccountConfigUpdateEvent],
 *   'playbackUpdate': [YotoAccountPlaybackUpdateEvent],
 *   'online': [YotoAccountOnlineEvent],
 *   'offline': [YotoAccountOfflineEvent],
 *   'mqttConnect': [YotoAccountMqttConnectEvent],
 *   'mqttDisconnect': [YotoAccountMqttDisconnectEvent],
 *   'mqttClose': [YotoAccountMqttCloseEvent],
 *   'mqttReconnect': [YotoAccountMqttReconnectEvent],
 *   'mqttOffline': [YotoAccountMqttOfflineEvent],
 *   'mqttEnd': [YotoAccountMqttEndEvent],
 *   'mqttStatus': [YotoAccountMqttStatusEvent],
 *   'mqttEvents': [YotoAccountMqttEventsEvent],
 *   'mqttStatusLegacy': [YotoAccountMqttStatusLegacyEvent],
 *   'mqttResponse': [YotoAccountMqttResponseEvent],
 *   'mqttUnknown': [YotoAccountMqttUnknownEvent],
 *   'error': [YotoAccountErrorEvent]
 * }} YotoAccountEventMap
 */

// ============================================================================
// YotoAccount Class
// ============================================================================

/**
 * Yoto Account client that manages all devices for an account
 *
 * Events:
 * - 'started' - Emitted when account starts, passes metadata with deviceCount and devices array
 * - 'stopped' - Emitted when account stops
 * - 'deviceAdded' - Emitted when a device is added, passes { deviceId }
 * - 'deviceRemoved' - Emitted when a device is removed, passes { deviceId }
 * - Device events are re-emitted with device context, see event map for signatures
 * - 'error' - Emitted when an error occurs, passes { error, context }
 *
 * Note: To listen to individual device events (statusUpdate, configUpdate, playbackUpdate, online, offline, etc.),
 * access the device models directly via account.devices or account.getDevice(deviceId) and attach listeners.
 *
 * @extends {EventEmitter<YotoAccountEventMap>}
 */
export class YotoAccount extends EventEmitter {
  /** @type {YotoClient} */ #client
  /** @type {Map<string, YotoDeviceModel>} */ #devices = new Map()
  /** @type {Map<string, YotoAccountDeviceEventHandlers>} */ #deviceEventHandlers = new Map()
  /** @type {YotoAccountOptions} */ #options
  /** @type {boolean} */ #running = false
  /** @type {boolean} */ #initialized = false

  /**
    * Create a Yoto account client
    * @param {YotoAccountOptions} options - Account configuration options
    */
  constructor (options) {
    super()

    this.#options = options

    // Create YotoClient with provided clientOptions
    this.#client = new YotoClient(options.clientOptions)
  }

  // ==========================================================================
  // Public API - State Accessors
  // ==========================================================================

  /**
   * Get the underlying YotoClient instance
   * @returns {YotoClient}
   */
  get client () { return this.#client }

  /**
   * Get all device models managed by this account
   * @returns {Map<string, YotoDeviceModel>}
   */
  get devices () { return this.#devices }

  /**
   * Check if account is currently running
   * @returns {boolean}
   */
  get running () { return this.#running }

  /**
   * Check if account has been initialized
   * @returns {boolean}
   */
  get initialized () { return this.#initialized }

  /**
   * Get a specific device by ID
   * @param {string} deviceId - Device ID
   * @returns {YotoDeviceModel | undefined}
   */
  getDevice (deviceId) { return this.#devices.get(deviceId) }

  /**
   * Get all device IDs
   * @returns {string[]}
   */
  getDeviceIds () { return Array.from(this.#devices.keys()) }

  // ==========================================================================
  // Public API - Lifecycle Management
  // ==========================================================================

  /**
   * Start the account client - creates YotoClient, discovers devices, starts all device clients
   * @returns {Promise<void>}
   * @throws {Error} If start fails
   */
  async start () {
    if (this.#running) {
      return // Already running
    }

    try {
      // Discover devices
      const devicesResponse = await this.#client.getDevices()

      // Create and start device models
      for (const device of devicesResponse.devices) {
        const deviceModel = new YotoDeviceModel(
          this.#client,
          device,
          this.#options.deviceOptions
        )

        // Set up device error forwarding
        this.#setupDeviceErrorHandling(deviceModel, device.deviceId)
        this.#setupDeviceEventForwarding(deviceModel, device.deviceId)

        // Track device
        this.#devices.set(device.deviceId, deviceModel)

        // Start device (await one at a time)
        try {
          await deviceModel.start()
        } catch (err) {
          const error = /** @type {Error} */ (err)
          this.emit('error', {
            error,
            context: {
              source: device.deviceId,
              deviceId: device.deviceId,
              operation: 'start'
            }
          })
        }

        this.emit('deviceAdded', {
          deviceId: device.deviceId
        })
      }

      // Mark as initialized and running
      this.#initialized = true
      this.#running = true

      this.emit('started', {
        deviceCount: this.#devices.size,
        devices: Array.from(this.#devices.keys())
      })
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', {
        error,
        context: {
          source: 'account',
          operation: 'start'
        }
      })
      throw error
    }
  }

  /**
   * Stop the account client - stops all device clients
   * @returns {Promise<void>}
   */
  async stop () {
    if (!this.#running) {
      return // Not running
    }

    try {
      // Stop all devices
      const stopPromises = []
      for (const [deviceId, deviceModel] of this.#devices) {
        this.#removeDeviceEventForwarding(deviceModel, deviceId)
        stopPromises.push(
          deviceModel.stop().catch((error) => {
            this.emit('error', {
              error,
              context: {
                source: deviceId,
                deviceId,
                operation: 'stop'
              }
            })
          })
        )
      }

      // Wait for all devices to stop (or fail gracefully)
      await Promise.allSettled(stopPromises)

      // Clear devices
      this.#devices.clear()
      this.#deviceEventHandlers.clear()

      // Mark as stopped
      this.#running = false

      this.emit('stopped')
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', {
        error,
        context: {
          source: 'account',
          operation: 'stop'
        }
      })
      throw error
    }
  }

  /**
   * Restart the account client - stops and starts again
   * @returns {Promise<void>}
   */
  async restart () {
    await this.stop()
    await this.start()
  }

  /**
   * Refresh device list - discovers new devices and removes missing ones
   * @returns {Promise<void>}
   */
  async refreshDevices () {
    if (!this.#client) {
      throw new Error('Account not started. Call start() first.')
    }

    try {
      // Get current devices from API
      const devicesResponse = await this.#client.getDevices()
      const currentDeviceIds = new Set(devicesResponse.devices.map(d => d.deviceId))
      const trackedDeviceIds = new Set(this.#devices.keys())

      // Find devices to add
      const devicesToAdd = devicesResponse.devices.filter(
        d => !trackedDeviceIds.has(d.deviceId)
      )

      // Find devices to remove
      const devicesToRemove = Array.from(trackedDeviceIds).filter(
        id => !currentDeviceIds.has(id)
      )

      // Remove missing devices
      for (const deviceId of devicesToRemove) {
        const deviceModel = this.#devices.get(deviceId)
        if (deviceModel) {
          this.#removeDeviceEventForwarding(deviceModel, deviceId)
          await deviceModel.stop().catch((error) => {
            this.emit('error', {
              error,
              context: {
                source: deviceId,
                deviceId,
                operation: 'remove'
              }
            })
          })
          this.#devices.delete(deviceId)
          this.emit('deviceRemoved', { deviceId })
        }
      }

      // Add new devices
      for (const device of devicesToAdd) {
        const deviceModel = new YotoDeviceModel(
          this.#client,
          device,
          this.#options.deviceOptions
        )

        // Set up device error forwarding
        this.#setupDeviceErrorHandling(deviceModel, device.deviceId)
        this.#setupDeviceEventForwarding(deviceModel, device.deviceId)

        // Track device
        this.#devices.set(device.deviceId, deviceModel)

        // Start device
        await deviceModel.start().catch((error) => {
          this.emit('error', {
            error,
            context: {
              source: device.deviceId,
              deviceId: device.deviceId,
              operation: 'add'
            }
          })
        })

        this.emit('deviceAdded', {
          deviceId: device.deviceId
        })
      }
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', {
        error,
        context: {
          source: 'account',
          operation: 'refreshDevices'
        }
      })
      throw error
    }
  }

  // ==========================================================================
  // Private - Device Management
  // ==========================================================================

  /**
   * Set up error handling for a device model
   * @param {YotoDeviceModel} deviceModel - Device model instance
   * @param {string} deviceId - Device ID
   */
  #setupDeviceErrorHandling (deviceModel, deviceId) {
    // Forward device errors to account-level error event
    deviceModel.on('error', (error) => {
      this.emit('error', {
        error,
        context: {
          source: deviceId,
          deviceId,
          operation: 'device-error'
        }
      })
    })
  }

  /**
   * Forward device events through the account event bus with device context
   * @param {YotoDeviceModel} deviceModel - Device model instance
   * @param {string} deviceId - Device ID
   */
  #setupDeviceEventForwarding (deviceModel, deviceId) {
    /** @type {YotoAccountDeviceEventHandlers} */
    const handlers = {
      statusUpdate: (status, source, changedFields) => {
        this.emit('statusUpdate', {
          deviceId,
          status,
          source,
          changedFields
        })
      },
      configUpdate: (config, changedFields) => {
        this.emit('configUpdate', {
          deviceId,
          config,
          changedFields
        })
      },
      playbackUpdate: (playback, changedFields) => {
        this.emit('playbackUpdate', {
          deviceId,
          playback,
          changedFields
        })
      },
      online: (metadata) => {
        this.emit('online', {
          deviceId,
          metadata
        })
      },
      offline: (metadata) => {
        this.emit('offline', {
          deviceId,
          metadata
        })
      },
      mqttConnect: (metadata) => {
        this.emit('mqttConnect', {
          deviceId,
          metadata
        })
      },
      mqttDisconnect: (metadata) => {
        this.emit('mqttDisconnect', {
          deviceId,
          metadata
        })
      },
      mqttClose: (metadata) => {
        this.emit('mqttClose', {
          deviceId,
          metadata
        })
      },
      mqttReconnect: () => {
        this.emit('mqttReconnect', {
          deviceId
        })
      },
      mqttOffline: () => {
        this.emit('mqttOffline', {
          deviceId
        })
      },
      mqttEnd: () => {
        this.emit('mqttEnd', {
          deviceId
        })
      },
      mqttStatus: (topic, message) => {
        this.emit('mqttStatus', {
          deviceId,
          topic,
          message
        })
      },
      mqttEvents: (topic, message) => {
        this.emit('mqttEvents', {
          deviceId,
          topic,
          message
        })
      },
      mqttStatusLegacy: (topic, message) => {
        this.emit('mqttStatusLegacy', {
          deviceId,
          topic,
          message
        })
      },
      mqttResponse: (topic, message) => {
        this.emit('mqttResponse', {
          deviceId,
          topic,
          message
        })
      },
      mqttUnknown: (topic, message) => {
        this.emit('mqttUnknown', {
          deviceId,
          topic,
          message
        })
      }
    }

    deviceModel.on('statusUpdate', handlers.statusUpdate)
    deviceModel.on('configUpdate', handlers.configUpdate)
    deviceModel.on('playbackUpdate', handlers.playbackUpdate)
    deviceModel.on('online', handlers.online)
    deviceModel.on('offline', handlers.offline)
    deviceModel.on('mqttConnect', handlers.mqttConnect)
    deviceModel.on('mqttDisconnect', handlers.mqttDisconnect)
    deviceModel.on('mqttClose', handlers.mqttClose)
    deviceModel.on('mqttReconnect', handlers.mqttReconnect)
    deviceModel.on('mqttOffline', handlers.mqttOffline)
    deviceModel.on('mqttEnd', handlers.mqttEnd)
    deviceModel.on('mqttStatus', handlers.mqttStatus)
    deviceModel.on('mqttEvents', handlers.mqttEvents)
    deviceModel.on('mqttStatusLegacy', handlers.mqttStatusLegacy)
    deviceModel.on('mqttResponse', handlers.mqttResponse)
    deviceModel.on('mqttUnknown', handlers.mqttUnknown)

    this.#deviceEventHandlers.set(deviceId, handlers)
  }

  /**
   * Remove forwarded device event handlers
   * @param {YotoDeviceModel} deviceModel - Device model instance
   * @param {string} deviceId - Device ID
   */
  #removeDeviceEventForwarding (deviceModel, deviceId) {
    const handlers = this.#deviceEventHandlers.get(deviceId)
    if (!handlers) return

    deviceModel.off('statusUpdate', handlers.statusUpdate)
    deviceModel.off('configUpdate', handlers.configUpdate)
    deviceModel.off('playbackUpdate', handlers.playbackUpdate)
    deviceModel.off('online', handlers.online)
    deviceModel.off('offline', handlers.offline)
    deviceModel.off('mqttConnect', handlers.mqttConnect)
    deviceModel.off('mqttDisconnect', handlers.mqttDisconnect)
    deviceModel.off('mqttClose', handlers.mqttClose)
    deviceModel.off('mqttReconnect', handlers.mqttReconnect)
    deviceModel.off('mqttOffline', handlers.mqttOffline)
    deviceModel.off('mqttEnd', handlers.mqttEnd)
    deviceModel.off('mqttStatus', handlers.mqttStatus)
    deviceModel.off('mqttEvents', handlers.mqttEvents)
    deviceModel.off('mqttStatusLegacy', handlers.mqttStatusLegacy)
    deviceModel.off('mqttResponse', handlers.mqttResponse)
    deviceModel.off('mqttUnknown', handlers.mqttUnknown)

    this.#deviceEventHandlers.delete(deviceId)
  }
}
