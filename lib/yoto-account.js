/**
 * @import { YotoClientConstructorOptions } from './api-client.js'
 * @import { YotoDeviceModelOptions } from './yoto-device.js'
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
 * Event map for YotoAccount
 * @typedef {{
 *   'started': [YotoAccountStartedMetadata],
 *   'stopped': [],
 *   'deviceAdded': [string, YotoDeviceModel],
 *   'deviceRemoved': [string],
 *   'error': [Error, YotoAccountErrorContext]
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
 * - 'deviceAdded' - Emitted when a device is added, passes (deviceId, deviceModel)
 * - 'deviceRemoved' - Emitted when a device is removed, passes deviceId
 * - 'error' - Emitted when an error occurs, passes (error, context)
 *
 * Note: To listen to individual device events (statusUpdate, configUpdate, playbackUpdate, online, offline, etc.),
 * access the device models directly via account.devices or account.getDevice(deviceId) and attach listeners.
 *
 * @extends {EventEmitter<YotoAccountEventMap>}
 */
export class YotoAccount extends EventEmitter {
  /** @type {YotoClient} */ #client
  /** @type {Map<string, YotoDeviceModel>} */ #devices = new Map()
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

        // Track device
        this.#devices.set(device.deviceId, deviceModel)

        // Start device (await one at a time)
        try {
          await deviceModel.start()
        } catch (err) {
          const error = /** @type {Error} */ (err)
          this.emit('error', error, {
            source: device.deviceId,
            deviceId: device.deviceId,
            operation: 'start'
          })
        }

        this.emit('deviceAdded', device.deviceId, deviceModel)
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
      this.emit('error', error, {
        source: 'account',
        operation: 'start'
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
        stopPromises.push(
          deviceModel.stop().catch((error) => {
            this.emit('error', error, {
              source: deviceId,
              deviceId,
              operation: 'stop'
            })
          })
        )
      }

      // Wait for all devices to stop (or fail gracefully)
      await Promise.allSettled(stopPromises)

      // Clear devices
      this.#devices.clear()

      // Mark as stopped
      this.#running = false

      this.emit('stopped')
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', error, {
        source: 'account',
        operation: 'stop'
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
          await deviceModel.stop().catch((error) => {
            this.emit('error', error, {
              source: deviceId,
              deviceId,
              operation: 'remove'
            })
          })
          this.#devices.delete(deviceId)
          this.emit('deviceRemoved', deviceId)
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

        // Track device
        this.#devices.set(device.deviceId, deviceModel)

        // Start device
        await deviceModel.start().catch((error) => {
          this.emit('error', error, {
            source: device.deviceId,
            deviceId: device.deviceId,
            operation: 'add'
          })
        })

        this.emit('deviceAdded', device.deviceId, deviceModel)
      }
    } catch (err) {
      const error = /** @type {Error} */ (err)
      this.emit('error', error, {
        source: 'account',
        operation: 'refreshDevices'
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
      this.emit('error', error, {
        source: deviceId,
        deviceId,
        operation: 'device-error'
      })
    })
  }
}
