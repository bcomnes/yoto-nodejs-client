/**
 * Get the official name for a nightlight color
 * @param {string} colorValue - Nightlight color value (hex code or 'off')
 * @returns {string} Official color name or the original value if not found
 */
export function getNightlightColorName(colorValue: string): string;
/**
 * Power source state
 * @typedef {'battery' | 'dock' | 'usb-c' | 'wireless'} PowerSource
 */
/**
 * Official Yoto nightlight colors
 *
 * Maps raw nightlight values to official color names.
 */
export const NIGHTLIGHT_COLORS: {
    '0x643600': string;
    '0x640000': string;
    '0x602d3c': string;
    '0x5a6400': string;
    '0x644800': string;
    '0x194a55': string;
    '0x646464': string;
    '0x000000': string;
    off: string;
};
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
export const YotoDeviceStatusType: {};
/**
 * Playback state from MQTT events
 * @typedef {Object} YotoPlaybackState
 * @property {string | null} cardId - Currently playing card ID TODO: Figure out name of card
 * @property {string | null} source - Playback source (e.g., 'card', 'remote', 'MQTT') TODO: Figure out what 'mqtt' source means. Card means card, remote means remotly played card.
 * @property {'playing' | 'paused' | 'stopped' | 'loading' | string | null} playbackStatus - Playback status
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
export const YotoPlaybackStateType: {};
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
 *   'error': [Error]
 * }} YotoDeviceModelEventMap
 */
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
 * - 'error' - Emitted when an error occurs, passes error
 *
 * @extends {EventEmitter<YotoDeviceModelEventMap>}
 */
export class YotoDeviceModel extends EventEmitter<YotoDeviceModelEventMap> {
    /**
     * Static reference to nightlight colors map
     *
     * @type {Record<string, string>}
     */
    static NIGHTLIGHT_COLORS: Record<string, string>;
    /**
     * Static method to get nightlight color name
     *
     * @param {string} colorValue - Nightlight color value (hex code or 'off')
     * @returns {string} Official color name or the original value if not found
     */
    static getNightlightColorName: typeof getNightlightColorName;
    /**
     * Create a Yoto device client
     * @param {YotoClient} client - Authenticated YotoClient instance
     * @param {YotoDevice} device - Device object from getDevices()
     * @param {YotoDeviceModelOptions} [options] - Client options
     */
    constructor(client: YotoClient, device: YotoDevice, options?: YotoDeviceModelOptions);
    /**
     * Get device information
     * @returns {YotoDevice}
     */
    get device(): YotoDevice;
    /**
     * Get current device status
     * @returns { YotoDeviceStatus }
     */
    get status(): YotoDeviceStatus;
    /**
     * Get device configuration
     * @returns {YotoDeviceConfig}
     */
    get config(): YotoDeviceConfig;
    /**
     * Get device shortcuts
     * @returns {YotoDeviceShortcuts }
     */
    get shortcuts(): YotoDeviceShortcuts;
    /**
     * Get current playback state
     * @returns {YotoPlaybackState}
     */
    get playback(): YotoPlaybackState;
    /**
     * Check if device has been initialized
     * @returns {boolean}
     */
    get initialized(): boolean;
    /**
     * Check if device client is running (started)
     * @returns {boolean}
     */
    get running(): boolean;
    /**
     * Check if MQTT client is connected
     * @returns {boolean}
     */
    get mqttConnected(): boolean;
    /**
     * Check if device is currently online (based on MQTT activity)
     * @returns {boolean}
     */
    get deviceOnline(): boolean;
    /**
     * Get device hardware capabilities based on deviceType
     * @returns {YotoDeviceCapabilities}
     */
    get capabilities(): YotoDeviceCapabilities;
    /**
     * Get nightlight information including color name
     * @returns {YotoDeviceNightlightInfo}
     */
    get nightlight(): YotoDeviceNightlightInfo;
    /**
     * Start the device client - fetches config, connects to MQTT, begins monitoring
     * @returns {Promise<void>}
     * @throws {Error} If start fails
     */
    start(): Promise<void>;
    /**
     * Stop the device client - disconnects MQTT, stops background polling
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
    /**
     * Restart the device client - stops and starts again
     * @returns {Promise<void>}
     */
    restart(): Promise<void>;
    /**
     * Get MQTT client instance
     * @returns {YotoMqttClient | null}
     */
    get mqttClient(): YotoMqttClient | null;
    /**
     * Refresh device status from HTTP API
     * This is primarily used as a fallback when device is offline
     * @returns {Promise<YotoDeviceStatus>}
     */
    /**
     * Refresh device config from HTTP API
     * @returns {Promise<YotoDeviceConfig>}
     */
    refreshConfig(): Promise<YotoDeviceConfig>;
    /**
     * Update device configuration
     * @param {Partial<YotoDeviceConfig>} configUpdate - Configuration changes
     * @returns {Promise<void>}
     */
    updateConfig(configUpdate: Partial<YotoDeviceConfig>): Promise<void>;
    /**
     * Send a device command via HTTP API
     * @param {YotoDeviceCommand} command - Command to send
     * @returns {Promise<YotoDeviceCommandResponse>}
     */
    sendCommand(command: YotoDeviceCommand): Promise<YotoDeviceCommandResponse>;
    #private;
}
/**
 * Card insertion state values
 */
export type CardInsertionState = "none" | "physical" | "remote";
/**
 * Day mode state
 */
export type DayMode = "unknown" | "night" | "day";
/**
 * Power source state
 */
export type PowerSource = "battery" | "dock" | "usb-c" | "wireless";
/**
 * Canonical device status - normalized format for both HTTP and MQTT sources
 *
 * This unified format resolves differences between HTTP and MQTT:
 * - HTTP uses string booleans ('0'/'1'), MQTT uses actual booleans
 * - HTTP has nullable fields, MQTT fields are non-nullable
 * - Field names match YotoDeviceStatusResponse with fallback to YotoDeviceFullStatus
 */
export type YotoDeviceStatus = {
    /**
     * - Active card ID or null when no card is active
     */
    activeCardId: string | null;
    /**
     * - Battery level percentage (integer 0-100)
     */
    batteryLevelPercentage: number;
    /**
     * - Whether device is currently charging
     */
    isCharging: boolean;
    /**
     * - Whether device is currently online
     */
    isOnline: boolean;
    /**
     * - User volume level (0-16 scale)
     */
    volume: number;
    /**
     * - Maximum volume limit (0-16 scale)
     */
    maxVolume: number;
    /**
     * - Card insertion state
     */
    cardInsertionState: CardInsertionState;
    /**
     * - Day mode status
     */
    dayMode: DayMode;
    /**
     * - Power source
     */
    powerSource: PowerSource;
    /**
     * - Firmware version
     */
    firmwareVersion: string;
    /**
     * - WiFi signal strength in dBm
     */
    wifiStrength: number;
    /**
     * - Free disk space in bytes
     */
    freeDiskSpaceBytes: number;
    /**
     * - Total disk space in bytes
     */
    totalDiskSpaceBytes: number;
    /**
     * - Whether headphones are connected
     */
    isAudioDeviceConnected: boolean;
    /**
     * - Whether Bluetooth headphones are enabled
     */
    isBluetoothAudioConnected: boolean;
    /**
     * - Current nightlight color (6-digit hex color like '0xff5733' or 'off'). Most accurate value comes from MQTT status. HTTP endpoint returns either 'off' or '0x000000'. Note: This is the live status; configured colors are in config.ambientColour (day) and config.nightAmbientColour (night). Only available on devices with colored nightlight (v3).
     */
    nightlightMode: string;
    /**
     * - Temperature in Celsius (null if not supported, can be number, string "0", or "notSupported") TODO: Number or null only
     */
    temperatureCelsius: string | number | null;
    /**
     * - Ambient light sensor reading TODO: Figure out units
     */
    ambientLightSensorReading: number;
    /**
     * - Current display brightness (null when device is off) - from YotoDeviceFullStatus (dnowBrightness integer 0-100)
     */
    displayBrightness: number | null;
    /**
     * - Time format preference - from YotoDeviceFullStatus
     */
    timeFormat: "12" | "24" | null;
    /**
     * - Device uptime in seconds
     */
    uptime: number;
    /**
     * - ISO 8601 timestamp of last update
     */
    updatedAt: string;
    /**
     * - Data source ('http' or 'mqtt') - metadata field added by stateful client
     */
    source: string;
};
/**
 * Playback state from MQTT events
 */
export type YotoPlaybackState = {
    /**
     * - Currently playing card ID TODO: Figure out name of card
     */
    cardId: string | null;
    /**
     * - Playback source (e.g., 'card', 'remote', 'MQTT') TODO: Figure out what 'mqtt' source means. Card means card, remote means remotly played card.
     */
    source: string | null;
    /**
     * - Playback status
     */
    playbackStatus: "playing" | "paused" | "stopped" | "loading" | string | null;
    /**
     * - Current track title
     */
    trackTitle: string | null;
    /**
     * - Current track key
     */
    trackKey: string | null;
    /**
     * - Current chapter title
     */
    chapterTitle: string | null;
    /**
     * - Current chapter key
     */
    chapterKey: string | null;
    /**
     * - Current position in seconds
     */
    position: number | null;
    /**
     * - Track duration in seconds
     */
    trackLength: number | null;
    /**
     * - Whether streaming
     */
    streaming: boolean | null;
    /**
     * - Sleep timer active
     */
    sleepTimerActive: boolean | null;
    /**
     * - Seconds remaining on sleep timer
     */
    sleepTimerSeconds: number | null;
    /**
     * - ISO 8601 timestamp of last update
     */
    updatedAt: string;
};
/**
 * Complete device client state
 */
export type YotoDeviceClientState = {
    /**
     * - Basic device information
     */
    device: YotoDevice;
    /**
     * - Device configuration (always initialized)
     */
    config: YotoDeviceConfig;
    /**
     * - Button shortcuts (always initialized)
     */
    shortcuts: YotoDeviceShortcuts;
    /**
     * - Current device status (always initialized)
     */
    status: YotoDeviceStatus;
    /**
     * - Current playback state (always initialized)
     */
    playback: YotoPlaybackState;
    /**
     * - Whether device has been initialized
     */
    initialized: boolean;
    /**
     * - Whether device client is currently running (started)
     */
    running: boolean;
    /**
     * - Timestamps of last updates
     */
    lastUpdate: {
        config: number | null;
        status: number | null;
        playback: number | null;
        source: string | null;
    };
};
/**
 * Device hardware capabilities based on deviceType
 */
export type YotoDeviceCapabilities = {
    /**
     * - Whether device has a temperature sensor
     */
    hasTemperatureSensor: boolean;
    /**
     * - Whether device has an ambient light sensor
     */
    hasAmbientLightSensor: boolean;
    /**
     * - Whether device has a colored nightlight
     */
    hasColoredNightlight: boolean;
    /**
     * - Whether this device type is supported
     */
    supported: boolean;
};
/**
 * Nightlight information
 */
export type YotoDeviceNightlightInfo = {
    /**
     * - Raw nightlight value (hex color like '0x643600' or 'off')
     */
    value: string;
    /**
     * - Official color name (e.g., 'Orange Peel', 'Off (screen up)')
     */
    name: string;
    /**
     * - Whether this device supports colored nightlight
     */
    supported: boolean;
};
/**
 * Device client initialization options
 */
export type YotoDeviceModelOptions = {
    /**
     * - MQTT.js client options to pass through to factory
     */
    mqttOptions?: MqttClientOptions;
    /**
     * - Background HTTP polling interval for config+status sync (default: 10 minutes)
     */
    httpPollIntervalMs?: number;
};
/**
 * Online event metadata
 */
export type YotoDeviceOnlineMetadata = {
    /**
     * - Reason device came online
     */
    reason: "startup" | "activity";
    /**
     * - Device uptime in seconds (only present for 'startup' reason)
     */
    upTime?: number | null;
};
/**
 * Offline event metadata
 */
export type YotoDeviceOfflineMetadata = {
    /**
     * - Reason device went offline
     */
    reason: "shutdown" | "timeout" | "http-status";
    /**
     * - Shutdown reason from device (only present for 'shutdown' reason)
     */
    shutDownReason?: string | null;
    /**
     * - Time since last seen in ms (only present for 'timeout' reason)
     */
    timeSinceLastSeen?: number | null;
    /**
     * - Source of status update (only present for 'http-status' reason)
     */
    source?: string;
};
/**
 * MQTT disconnect event metadata (from MQTT disconnect packet)
 */
export type YotoMqttDisconnectMetadata = YotoMqttClientDisconnectMetadata;
/**
 * MQTT close event metadata (from connection close)
 */
export type YotoMqttCloseMetadata = YotoMqttClientCloseMetadata;
/**
 * Started event metadata
 */
export type YotoDeviceStartedMetadata = {
    /**
     * - Device information
     */
    device: YotoDevice;
    /**
     * - Device configuration
     */
    config: YotoDeviceConfig;
    /**
     * - Device shortcuts
     */
    shortcuts: YotoDeviceShortcuts;
    /**
     * - Device status
     */
    status: YotoDeviceStatus;
    /**
     * - Playback state
     */
    playback: YotoPlaybackState;
    /**
     * - Whether initialized
     */
    initialized: boolean;
    /**
     * - Whether running
     */
    running: boolean;
};
/**
 * Event map for YotoDeviceModel
 */
export type YotoDeviceModelEventMap = {
    "started": [YotoDeviceStartedMetadata];
    "stopped": [];
    "statusUpdate": [YotoDeviceStatus, string, Set<keyof YotoDeviceStatus>];
    "configUpdate": [YotoDeviceConfig, Set<keyof YotoDeviceConfig>];
    "playbackUpdate": [YotoPlaybackState, Set<keyof YotoPlaybackState>];
    "online": [YotoDeviceOnlineMetadata];
    "offline": [YotoDeviceOfflineMetadata];
    "mqttConnect": [];
    "mqttDisconnect": [YotoMqttDisconnectMetadata];
    "mqttClose": [YotoMqttCloseMetadata];
    "mqttReconnect": [];
    "error": [Error];
};
import { EventEmitter } from 'events';
import type { YotoDevice } from './api-endpoints/devices.js';
import type { YotoDeviceConfig } from './api-endpoints/devices.js';
import type { YotoDeviceShortcuts } from './api-endpoints/devices.js';
import type { YotoMqttClient } from './mqtt/client.js';
import type { YotoDeviceCommand } from './api-endpoints/devices.js';
import type { YotoDeviceCommandResponse } from './api-endpoints/devices.js';
import type { YotoClient } from './api-client.js';
import type { MqttClientOptions } from './mqtt/factory.js';
import type { YotoMqttClientDisconnectMetadata } from './mqtt/client.js';
import type { YotoMqttClientCloseMetadata } from './mqtt/client.js';
//# sourceMappingURL=yoto-device.d.ts.map