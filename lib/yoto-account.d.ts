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
export class YotoAccount extends EventEmitter<YotoAccountEventMap> {
    /**
      * Create a Yoto account client
      * @param {YotoAccountOptions} options - Account configuration options
      */
    constructor(options: YotoAccountOptions);
    /**
     * Get the underlying YotoClient instance
     * @returns {YotoClient}
     */
    get client(): YotoClient;
    /**
     * Get all device models managed by this account
     * @returns {Map<string, YotoDeviceModel>}
     */
    get devices(): Map<string, YotoDeviceModel>;
    /**
     * Check if account is currently running
     * @returns {boolean}
     */
    get running(): boolean;
    /**
     * Check if account has been initialized
     * @returns {boolean}
     */
    get initialized(): boolean;
    /**
     * Get a specific device by ID
     * @param {string} deviceId - Device ID
     * @returns {YotoDeviceModel | undefined}
     */
    getDevice(deviceId: string): YotoDeviceModel | undefined;
    /**
     * Get all device IDs
     * @returns {string[]}
     */
    getDeviceIds(): string[];
    /**
     * Start the account client - creates YotoClient, discovers devices, starts all device clients
     * @returns {Promise<void>}
     * @throws {Error} If start fails
     */
    start(): Promise<void>;
    /**
     * Stop the account client - stops all device clients
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
    /**
     * Restart the account client - stops and starts again
     * @returns {Promise<void>}
     */
    restart(): Promise<void>;
    /**
     * Refresh device list - discovers new devices and removes missing ones
     * @returns {Promise<void>}
     */
    refreshDevices(): Promise<void>;
    #private;
}
/**
 * Yoto Account initialization options
 */
export type YotoAccountOptions = {
    /**
     * - Yoto API client Options
     */
    clientOptions: YotoClientConstructorOptions;
    /**
     * - Yoto Device Model Options
     */
    deviceOptions: YotoDeviceModelOptions;
};
/**
 * Error context information
 */
export type YotoAccountErrorContext = {
    /**
     * - Error source ('account', 'client', or deviceId)
     */
    source: string;
    /**
     * - Device ID if error is device-specific
     */
    deviceId?: string;
    /**
     * - Operation that failed
     */
    operation?: string;
};
/**
 * Started event metadata
 */
export type YotoAccountStartedMetadata = {
    /**
     * - Number of devices managed
     */
    deviceCount: number;
    /**
     * - Array of device IDs
     */
    devices: string[];
};
/**
 * Event map for YotoAccount
 */
export type YotoAccountEventMap = {
    "started": [YotoAccountStartedMetadata];
    "stopped": [];
    "deviceAdded": [string, YotoDeviceModel];
    "deviceRemoved": [string];
    "error": [Error, YotoAccountErrorContext];
};
import { EventEmitter } from 'events';
import { YotoClient } from './api-client.js';
import { YotoDeviceModel } from './yoto-device.js';
import type { YotoClientConstructorOptions } from './api-client.js';
import type { YotoDeviceModelOptions } from './yoto-device.js';
//# sourceMappingURL=yoto-account.d.ts.map