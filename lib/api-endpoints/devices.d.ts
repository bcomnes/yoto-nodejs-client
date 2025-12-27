/**
 * @see https://yoto.dev/api/getdevices/
 * @typedef {Object} YotoDevicesResponse
 * @property {YotoDevice[]} devices
 */
/**
 * @see https://yoto.dev/api/getdevices/
 * @typedef {Object} YotoDevice
 * @property {string} deviceId - The unique identifier for the device
 * @property {string} name - The name of the device
 * @property {string} description - A brief description of the device
 * @property {boolean} online - Indicates whether the device is currently online
 * @property {string} releaseChannel - The release channel of the device
 * @property {string} deviceType - The type of the device
 * @property {string} deviceFamily - The family to which the device belongs
 * @property {string} deviceGroup - The group classification of the device
 * @property {string} [generation] - Device generation (e.g., 'gen3')
 * @property {string} [formFactor] - Device form factor (e.g., 'standard', 'mini')
 */
/**
 * Retrieves the list of devices associated with the authenticated user.
 * @see https://yoto.dev/api/getdevices/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDevicesResponse>} The user's devices
 */
export function getDevices({ accessToken, userAgent, requestOptions }: {
    accessToken: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDevicesResponse>;
/**
 * @see https://yoto.dev/api/getdevicestatus/
 * @typedef {Object} YotoDeviceStatusResponse
 * @property {string} deviceId - Unique identifier of the device
 * @property {string} activeCard - Active card on the device (can be 'none')
 * @property {number} ambientLightSensorReading - Reading from ambient light sensor
 * @property {number} averageDownloadSpeedBytesSecond - Average download speed in bytes per second
 * @property {number} batteryLevelPercentage - Battery level in percentage
 * @property {number} batteryLevelPercentageRaw - Raw battery level percentage
 * @property {number} buzzErrors - Number of buzz errors
 * @property {0 | 1 | 2} cardInsertionState - Card insertion state from API (0=none, 1=physical, 2=remote) - converted to CardInsertionState string union in YotoDeviceStatus
 * @property {-1 | 0 | 1} dayMode - Day mode status (-1=unknown, 0=night, 1=day)
 * @property {number} errorsLogged - Number of errors logged
 * @property {string} firmwareVersion - Firmware version (e.g., 'v2.23.2')
 * @property {number} freeDiskSpaceBytes - Free disk space in bytes
 * @property {boolean} isAudioDeviceConnected - Whether audio device is connected
 * @property {boolean} isBackgroundDownloadActive - Whether background download is active
 * @property {boolean} isBluetoothAudioConnected - Whether Bluetooth audio is connected
 * @property {boolean} isCharging - Whether device is currently charging
 * @property {number} isNfcLocked - NFC lock status
 * @property {boolean} isOnline - Whether device is currently online
 * @property {string} networkSsid - Network SSID device is connected to
 * @property {string} nightlightMode - Current nightlight color (HTTP returns 'off' or '0x000000'; MQTT provides actual hex color like '0xff5733')
 * @property {number} playingSource - Currently playing source
 * @property {string | null} powerCapabilities - Power capabilities (e.g., '0x02')
 * @property {0 | 1 | 2 | 3} powerSource - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
 * @property {number} systemVolumePercentage - System/max volume in percentage (0-100, represents 0-16 hardware scale, maps to volumeMax in events)
 * @property {number} taskWatchdogTimeoutCount - Task watchdog timeout count
 * @property {string | number} temperatureCelcius - Temperature in Celsius (can be number or string like "0" or "notSupported") - Note: API misspells "Celsius"
 * @property {number} totalDiskSpaceBytes - Total disk space in bytes
 * @property {string} updatedAt - Timestamp of last update
 * @property {number} uptime - Uptime of the device in seconds
 * @property {number} userVolumePercentage - User volume in percentage (0-100, represents 0-16 hardware scale, maps to volume in events)
 * @property {number} utcOffsetSeconds - UTC offset in seconds
 * @property {number} utcTime - UTC time as Unix timestamp
 * @property {number} wifiStrength - WiFi connection strength in decibels
 */
/**
 * Retrieves the current status of a specific device.
 * @see https://yoto.dev/api/getdevicestatus/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.deviceId The device ID to get status for
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeviceStatusResponse>} The device status
 */
export function getDeviceStatus({ accessToken, userAgent, deviceId, requestOptions }: {
    accessToken: string;
    deviceId: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDeviceStatusResponse>;
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoDeviceConfigResponse
 * @property {YotoDeviceConfigDevice} device
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoDeviceConfigDevice
 * @property {YotoDeviceConfig} config - Device configuration settings
 * @property {string} deviceFamily - Device family (e.g., 'v2', 'v3', 'mini')
 * @property {string} deviceGroup - Device group classification
 * @property {string} deviceId - Unique identifier for the device
 * @property {string} deviceType - Type of device
 * @property {any} errorCode - Error code (null if no error)
 * @property {string} geoTimezone - Geographic timezone (e.g., 'Europe/London')
 * @property {string} getPosix - POSIX timezone string
 * @property {string} mac - MAC address
 * @property {string} name - Device name (undocumented)
 * @property {boolean} online - Whether device is online
 * @property {string} registrationCode - Device registration code
 * @property {string} activationPopCode - Activation POP code (undocumented)
 * @property {string} popCode - POP code (undocumented)
 * @property {string} releaseChannelId - Release channel identifier
 * @property {string} releaseChannelVersion - Release channel version
 * @property {string} fwVersion - Firmware version (undocumented)
 * @property {YotoDeviceFullStatus} status - Comprehensive device status object (undocumented)
 * @property {YotoDeviceShortcuts} shortcuts - Button shortcuts configuration (beta feature)
 */
/**
 * Comprehensive device status from HTTP config endpoint (undocumented)
 * Contains both user-facing fields and low-level hardware/diagnostic data
 * Note: Many fields are nullable when device hasn't synced settings yet
 * @typedef {Object} YotoDeviceFullStatus
 * @property {string} activeCard - Active card ID or 'none'
 * @property {number | null} aliveTime - Total time device has been alive
 * @property {number} als - Ambient light sensor reading
 * @property {number | null} battery - Raw battery voltage
 * @property {number} batteryLevel - Battery level percentage
 * @property {number} batteryLevelRaw - Raw battery level percentage
 * @property {number | null} batteryRemaining - Battery remaining time estimate
 * @property {0 | 1} bgDownload - Background download status (0 or 1)
 * @property {0 | 1} bluetoothHp - Bluetooth headphones enabled (0 or 1)
 * @property {number} buzzErrors - Number of buzz errors
 * @property {number} bytesPS - Bytes per second transfer rate
 * @property {0 | 1 | 2} cardInserted - Card insertion state (0=none, 1=physical, 2=remote)
 * @property {number | null} chgStatLevel - Charge state level
 * @property {0 | 1} charging - Charging state (0 or 1)
 * @property {-1 | 0 | 1} day - Day mode (0=night, 1=day, -1=unknown)
 * @property {number | null} dayBright - Day brightness setting
 * @property {number | null} dbatTimeout - DBAT timeout value
 * @property {string} deviceId - Device unique identifier
 * @property {number | null} dnowBrightness - Current display brightness
 * @property {number} errorsLogged - Number of errors logged
 * @property {any} failData - Failure data (null if none)
 * @property {any} failReason - Failure reason (null if none)
 * @property {number | null} free - Free memory in bytes
 * @property {number | null} free32 - Free 32-bit memory pool
 * @property {number} freeDisk - Free disk space in bytes
 * @property {number | null} freeDMA - Free DMA memory
 * @property {string} fwVersion - Firmware version
 * @property {0 | 1} headphones - Headphones connected (0 or 1)
 * @property {string | null} lastSeenAt - Last seen timestamp
 * @property {number | null} missedLogs - Number of missed log entries
 * @property {string} nfcErrs - NFC errors (e.g., 'n/a')
 * @property {number} nfcLock - NFC lock status
 * @property {number | null} nightBright - Night brightness setting
 * @property {string} nightlightMode - Current nightlight color (hex color like '0xff5733' or 'off')
 * @property {number} playingStatus - Playing status code
 * @property {string | null} powerCaps - Power capabilities
 * @property {0 | 1 | 2 | 3} powerSrc - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
 * @property {number | null} qiOtp - Qi OTP value
 * @property {string | null} sd_info - SD card information
 * @property {string | null} shutDown - Shutdown reason ('nA' = running, 'userShutdown' = powered off, etc.)
 * @property {number | null} shutdownTimeout - Shutdown timeout in seconds
 * @property {string} ssid - WiFi SSID
 * @property {number | null} statusVersion - Status version number
 * @property {string} temp - Temperature readings (format: 'value1:value2' or 'value1:notSupported')
 * @property {'12' | '24' | null} timeFormat - Time format ('12' or '24')
 * @property {number} totalDisk - Total disk space in bytes
 * @property {number} twdt - Task watchdog timeout count
 * @property {string} updatedAt - Last update timestamp (ISO 8601)
 * @property {number} upTime - Uptime in seconds
 * @property {number} userVolume - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
 * @property {number} utcOffset - UTC offset in seconds
 * @property {number} utcTime - UTC time as Unix timestamp
 * @property {number} volume - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
 * @property {number | null} wifiRestarts - Number of WiFi restarts
 * @property {number} wifiStrength - WiFi signal strength in dBm
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoDeviceConfig
 * @property {string[]} alarms - Array of alarm strings in comma-separated format (e.g., '1111111,1100,5WsQg,,,8')
 * @property {string} ambientColour - Ambient light color (hex code)
 * @property {string} bluetoothEnabled - Bluetooth enabled state ('0' or '1')
 * @property {boolean} btHeadphonesEnabled - Bluetooth headphones enabled
 * @property {string} clockFace - Clock face style (e.g., 'digital-sun')
 * @property {string} dayDisplayBrightness - Day display brightness (e.g., 'auto', '0' - '100')
 * @property {string} dayTime - Day mode start time (e.g., '07:00')
 * @property {string} dayYotoDaily - Day mode Yoto Daily card path
 * @property {string} dayYotoRadio - Day mode Yoto Radio card path
 * @property {string} daySoundsOff - Day sounds off setting ('0' or '1') (undocumented)
 * @property {string} displayDimBrightness - Display dim brightness level (undocumented)
 * @property {string} displayDimTimeout - Display dim timeout in seconds
 * @property {boolean} headphonesVolumeLimited - Whether headphones volume is limited
 * @property {string} hourFormat - Hour format ('12' or '24') (undocumented)
 * @property {string} logLevel - Log level (e.g., 'none') (undocumented)
 * @property {string} locale - Device locale (e.g., 'en') (undocumented)
 * @property {string} maxVolumeLimit - Maximum volume limit
 * @property {string} nightAmbientColour - Night ambient light color (hex code)
 * @property {string} nightDisplayBrightness - Night display brightness (e.g., 'auto', '0' - '100')
 * @property {string} nightMaxVolumeLimit - Night maximum volume limit
 * @property {string} nightTime - Night mode start time (e.g., '19:20')
 * @property {string} nightYotoDaily - Night mode Yoto Daily card path
 * @property {string} nightYotoRadio - Night mode Yoto Radio card path (can be '0' for none)
 * @property {string} nightSoundsOff - Night sounds off setting ('0' or '1') (undocumented)
 * @property {boolean} pausePowerButton - Pause on power button press (undocumented)
 * @property {boolean} pauseVolumeDown - Pause on volume down (undocumented)
 * @property {boolean} repeatAll - Whether repeat all is enabled
 * @property {boolean} showDiagnostics - Show diagnostics (undocumented)
 * @property {string} shutdownTimeout - Shutdown timeout in seconds
 * @property {string} systemVolume - System volume level (e.g., '100') (undocumented)
 * @property {string} timezone - Timezone setting (empty string if not set) (undocumented)
 * @property {string} volumeLevel - Volume level preset (e.g., 'safe') (undocumented)
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoDeviceShortcuts
 * @property {YotoShortcutModes} modes - Shortcut modes for day and night
 * @property {string} versionId - Shortcuts configuration version ID
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoShortcutModes
 * @property {YotoShortcutMode} day - Day mode shortcuts
 * @property {YotoShortcutMode} night - Night mode shortcuts
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoShortcutMode
 * @property {YotoShortcutContent[]} content - Array of shortcut content commands
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoShortcutContent
 * @property {string} cmd - Command type (e.g., 'track-play')
 * @property {YotoShortcutParams} params - Command parameters
 */
/**
 * @see https://yoto.dev/api/getdeviceconfig/
 * @typedef {Object} YotoShortcutParams
 * @property {string} card - Card ID
 * @property {string} chapter - Chapter identifier
 * @property {string} track - Track identifier
 */
/**
 * Retrieves the configuration details for a specific device.
 * @see https://yoto.dev/api/getdeviceconfig/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.deviceId The device ID to get config for
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeviceConfigResponse>} The device configuration
 */
export function getDeviceConfig({ accessToken, userAgent, deviceId, requestOptions }: {
    accessToken: string;
    deviceId: string;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDeviceConfigResponse>;
/**
 * @see https://yoto.dev/api/updatedeviceconfig/
 * @typedef {Object} YotoUpdateDeviceConfigRequest
 * @property {string} [name] - Device name
 * @property {Partial<YotoDeviceConfig>} config - Configuration settings to update (all fields optional)
 */
/**
 * @see https://yoto.dev/api/updatedeviceconfig/
 * @typedef {Object} YotoUpdateDeviceConfigResponse
 * @property {string} status - Status of the update operation (e.g., 'ok')
 */
/**
 * Updates the configuration settings for a specific device.
 * @see https://yoto.dev/api/updatedeviceconfig/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.deviceId The device ID to update config for
 * @param  {YotoUpdateDeviceConfigRequest} options.configUpdate The configuration updates to apply (all config fields are optional)
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoUpdateDeviceConfigResponse>} The update response
 */
export function updateDeviceConfig({ accessToken, userAgent, deviceId, configUpdate, requestOptions }: {
    accessToken: string;
    deviceId: string;
    configUpdate: YotoUpdateDeviceConfigRequest;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUpdateDeviceConfigResponse>;
/**
 * @see https://yoto.dev/api/updateshortcutsbeta/
 * @typedef {Object} YotoUpdateShortcutsRequest
 * @property {YotoDeviceShortcuts} shortcuts - Shortcuts configuration to update
 */
/**
 * @see https://yoto.dev/api/updateshortcutsbeta/
 * @typedef {Object} YotoUpdateShortcutsResponse
 * @property {string} status - Status of the update operation (e.g., 'ok')
 */
/**
 * Updates the shortcuts configuration for a specific device (beta feature).
 * @see https://yoto.dev/api/updateshortcutsbeta/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.deviceId The device ID to update shortcuts for
 * @param  {YotoUpdateShortcutsRequest} options.shortcutsUpdate The shortcuts configuration to update
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoUpdateShortcutsResponse>} The update response
 */
export function updateDeviceShortcuts({ accessToken, userAgent, deviceId, shortcutsUpdate, requestOptions }: {
    accessToken: string;
    deviceId: string;
    shortcutsUpdate: YotoUpdateShortcutsRequest;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoUpdateShortcutsResponse>;
/**
 * @see https://yoto.dev/api/senddevicecommand/
 * @see https://yoto.dev/players-mqtt/mqtt-docs/
 * @typedef {Object} YotoDeviceCommandResponse
 * @property {string} status - Status of the command (e.g., 'ok')
 */
/**
 * MQTT command types that can be sent to a device.
 * Uses command types from the mqtt module.
 * @see https://yoto.dev/players-mqtt/mqtt-docs/
 * @typedef {YotoVolumeCommand | YotoAmbientCommand | YotoSleepTimerCommand | YotoCardStartCommand | YotoBluetoothCommand | YotoDisplayPreviewCommand | {}} YotoDeviceCommand
 */
/**
 * Sends an MQTT command to a device.
 * This is a mutation endpoint that controls device behavior.
 * @see https://yoto.dev/api/senddevicecommand/
 * @see https://yoto.dev/players-mqtt/mqtt-docs/
 * @param  {object} options
 * @param  {string} options.accessToken    The API token to request with
 * @param  {string} options.deviceId The device ID to send command to
 * @param  {YotoDeviceCommand} options.command The MQTT command payload to send
 * @param  {string} [options.userAgent]  Optional user agent string
 * @param  {RequestOptions} [options.requestOptions]  Additional undici request options
 * @return {Promise<YotoDeviceCommandResponse>} The command response
 */
export function sendDeviceCommand({ accessToken, userAgent, deviceId, command, requestOptions }: {
    accessToken: string;
    deviceId: string;
    command: YotoDeviceCommand;
    userAgent?: string | undefined;
    requestOptions?: ({
        dispatcher?: import("undici").Dispatcher;
    } & Omit<import("undici").Dispatcher.RequestOptions<unknown>, "origin" | "path" | "method"> & Partial<Pick<import("undici").Dispatcher.RequestOptions<null>, "method">>) | undefined;
}): Promise<YotoDeviceCommandResponse>;
export type YotoDevicesResponse = {
    devices: YotoDevice[];
};
export type YotoDevice = {
    /**
     * - The unique identifier for the device
     */
    deviceId: string;
    /**
     * - The name of the device
     */
    name: string;
    /**
     * - A brief description of the device
     */
    description: string;
    /**
     * - Indicates whether the device is currently online
     */
    online: boolean;
    /**
     * - The release channel of the device
     */
    releaseChannel: string;
    /**
     * - The type of the device
     */
    deviceType: string;
    /**
     * - The family to which the device belongs
     */
    deviceFamily: string;
    /**
     * - The group classification of the device
     */
    deviceGroup: string;
    /**
     * - Device generation (e.g., 'gen3')
     */
    generation?: string;
    /**
     * - Device form factor (e.g., 'standard', 'mini')
     */
    formFactor?: string;
};
export type YotoDeviceStatusResponse = {
    /**
     * - Unique identifier of the device
     */
    deviceId: string;
    /**
     * - Active card on the device (can be 'none')
     */
    activeCard: string;
    /**
     * - Reading from ambient light sensor
     */
    ambientLightSensorReading: number;
    /**
     * - Average download speed in bytes per second
     */
    averageDownloadSpeedBytesSecond: number;
    /**
     * - Battery level in percentage
     */
    batteryLevelPercentage: number;
    /**
     * - Raw battery level percentage
     */
    batteryLevelPercentageRaw: number;
    /**
     * - Number of buzz errors
     */
    buzzErrors: number;
    /**
     * - Card insertion state from API (0=none, 1=physical, 2=remote) - converted to CardInsertionState string union in YotoDeviceStatus
     */
    cardInsertionState: 0 | 1 | 2;
    /**
     * - Day mode status (-1=unknown, 0=night, 1=day)
     */
    dayMode: -1 | 0 | 1;
    /**
     * - Number of errors logged
     */
    errorsLogged: number;
    /**
     * - Firmware version (e.g., 'v2.23.2')
     */
    firmwareVersion: string;
    /**
     * - Free disk space in bytes
     */
    freeDiskSpaceBytes: number;
    /**
     * - Whether audio device is connected
     */
    isAudioDeviceConnected: boolean;
    /**
     * - Whether background download is active
     */
    isBackgroundDownloadActive: boolean;
    /**
     * - Whether Bluetooth audio is connected
     */
    isBluetoothAudioConnected: boolean;
    /**
     * - Whether device is currently charging
     */
    isCharging: boolean;
    /**
     * - NFC lock status
     */
    isNfcLocked: number;
    /**
     * - Whether device is currently online
     */
    isOnline: boolean;
    /**
     * - Network SSID device is connected to
     */
    networkSsid: string;
    /**
     * - Current nightlight color (HTTP returns 'off' or '0x000000'; MQTT provides actual hex color like '0xff5733')
     */
    nightlightMode: string;
    /**
     * - Currently playing source
     */
    playingSource: number;
    /**
     * - Power capabilities (e.g., '0x02')
     */
    powerCapabilities: string | null;
    /**
     * - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
     */
    powerSource: 0 | 1 | 2 | 3;
    /**
     * - System/max volume in percentage (0-100, represents 0-16 hardware scale, maps to volumeMax in events)
     */
    systemVolumePercentage: number;
    /**
     * - Task watchdog timeout count
     */
    taskWatchdogTimeoutCount: number;
    /**
     * - Temperature in Celsius (can be number or string like "0" or "notSupported") - Note: API misspells "Celsius"
     */
    temperatureCelcius: string | number;
    /**
     * - Total disk space in bytes
     */
    totalDiskSpaceBytes: number;
    /**
     * - Timestamp of last update
     */
    updatedAt: string;
    /**
     * - Uptime of the device in seconds
     */
    uptime: number;
    /**
     * - User volume in percentage (0-100, represents 0-16 hardware scale, maps to volume in events)
     */
    userVolumePercentage: number;
    /**
     * - UTC offset in seconds
     */
    utcOffsetSeconds: number;
    /**
     * - UTC time as Unix timestamp
     */
    utcTime: number;
    /**
     * - WiFi connection strength in decibels
     */
    wifiStrength: number;
};
export type YotoDeviceConfigResponse = {
    device: YotoDeviceConfigDevice;
};
export type YotoDeviceConfigDevice = {
    /**
     * - Device configuration settings
     */
    config: YotoDeviceConfig;
    /**
     * - Device family (e.g., 'v2', 'v3', 'mini')
     */
    deviceFamily: string;
    /**
     * - Device group classification
     */
    deviceGroup: string;
    /**
     * - Unique identifier for the device
     */
    deviceId: string;
    /**
     * - Type of device
     */
    deviceType: string;
    /**
     * - Error code (null if no error)
     */
    errorCode: any;
    /**
     * - Geographic timezone (e.g., 'Europe/London')
     */
    geoTimezone: string;
    /**
     * - POSIX timezone string
     */
    getPosix: string;
    /**
     * - MAC address
     */
    mac: string;
    /**
     * - Device name (undocumented)
     */
    name: string;
    /**
     * - Whether device is online
     */
    online: boolean;
    /**
     * - Device registration code
     */
    registrationCode: string;
    /**
     * - Activation POP code (undocumented)
     */
    activationPopCode: string;
    /**
     * - POP code (undocumented)
     */
    popCode: string;
    /**
     * - Release channel identifier
     */
    releaseChannelId: string;
    /**
     * - Release channel version
     */
    releaseChannelVersion: string;
    /**
     * - Firmware version (undocumented)
     */
    fwVersion: string;
    /**
     * - Comprehensive device status object (undocumented)
     */
    status: YotoDeviceFullStatus;
    /**
     * - Button shortcuts configuration (beta feature)
     */
    shortcuts: YotoDeviceShortcuts;
};
/**
 * Comprehensive device status from HTTP config endpoint (undocumented)
 * Contains both user-facing fields and low-level hardware/diagnostic data
 * Note: Many fields are nullable when device hasn't synced settings yet
 */
export type YotoDeviceFullStatus = {
    /**
     * - Active card ID or 'none'
     */
    activeCard: string;
    /**
     * - Total time device has been alive
     */
    aliveTime: number | null;
    /**
     * - Ambient light sensor reading
     */
    als: number;
    /**
     * - Raw battery voltage
     */
    battery: number | null;
    /**
     * - Battery level percentage
     */
    batteryLevel: number;
    /**
     * - Raw battery level percentage
     */
    batteryLevelRaw: number;
    /**
     * - Battery remaining time estimate
     */
    batteryRemaining: number | null;
    /**
     * - Background download status (0 or 1)
     */
    bgDownload: 0 | 1;
    /**
     * - Bluetooth headphones enabled (0 or 1)
     */
    bluetoothHp: 0 | 1;
    /**
     * - Number of buzz errors
     */
    buzzErrors: number;
    /**
     * - Bytes per second transfer rate
     */
    bytesPS: number;
    /**
     * - Card insertion state (0=none, 1=physical, 2=remote)
     */
    cardInserted: 0 | 1 | 2;
    /**
     * - Charge state level
     */
    chgStatLevel: number | null;
    /**
     * - Charging state (0 or 1)
     */
    charging: 0 | 1;
    /**
     * - Day mode (0=night, 1=day, -1=unknown)
     */
    day: -1 | 0 | 1;
    /**
     * - Day brightness setting
     */
    dayBright: number | null;
    /**
     * - DBAT timeout value
     */
    dbatTimeout: number | null;
    /**
     * - Device unique identifier
     */
    deviceId: string;
    /**
     * - Current display brightness
     */
    dnowBrightness: number | null;
    /**
     * - Number of errors logged
     */
    errorsLogged: number;
    /**
     * - Failure data (null if none)
     */
    failData: any;
    /**
     * - Failure reason (null if none)
     */
    failReason: any;
    /**
     * - Free memory in bytes
     */
    free: number | null;
    /**
     * - Free 32-bit memory pool
     */
    free32: number | null;
    /**
     * - Free disk space in bytes
     */
    freeDisk: number;
    /**
     * - Free DMA memory
     */
    freeDMA: number | null;
    /**
     * - Firmware version
     */
    fwVersion: string;
    /**
     * - Headphones connected (0 or 1)
     */
    headphones: 0 | 1;
    /**
     * - Last seen timestamp
     */
    lastSeenAt: string | null;
    /**
     * - Number of missed log entries
     */
    missedLogs: number | null;
    /**
     * - NFC errors (e.g., 'n/a')
     */
    nfcErrs: string;
    /**
     * - NFC lock status
     */
    nfcLock: number;
    /**
     * - Night brightness setting
     */
    nightBright: number | null;
    /**
     * - Current nightlight color (hex color like '0xff5733' or 'off')
     */
    nightlightMode: string;
    /**
     * - Playing status code
     */
    playingStatus: number;
    /**
     * - Power capabilities
     */
    powerCaps: string | null;
    /**
     * - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
     */
    powerSrc: 0 | 1 | 2 | 3;
    /**
     * - Qi OTP value
     */
    qiOtp: number | null;
    /**
     * - SD card information
     */
    sd_info: string | null;
    /**
     * - Shutdown reason ('nA' = running, 'userShutdown' = powered off, etc.)
     */
    shutDown: string | null;
    /**
     * - Shutdown timeout in seconds
     */
    shutdownTimeout: number | null;
    /**
     * - WiFi SSID
     */
    ssid: string;
    /**
     * - Status version number
     */
    statusVersion: number | null;
    /**
     * - Temperature readings (format: 'value1:value2' or 'value1:notSupported')
     */
    temp: string;
    /**
     * - Time format ('12' or '24')
     */
    timeFormat: "12" | "24" | null;
    /**
     * - Total disk space in bytes
     */
    totalDisk: number;
    /**
     * - Task watchdog timeout count
     */
    twdt: number;
    /**
     * - Last update timestamp (ISO 8601)
     */
    updatedAt: string;
    /**
     * - Uptime in seconds
     */
    upTime: number;
    /**
     * - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
     */
    userVolume: number;
    /**
     * - UTC offset in seconds
     */
    utcOffset: number;
    /**
     * - UTC time as Unix timestamp
     */
    utcTime: number;
    /**
     * - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
     */
    volume: number;
    /**
     * - Number of WiFi restarts
     */
    wifiRestarts: number | null;
    /**
     * - WiFi signal strength in dBm
     */
    wifiStrength: number;
};
export type YotoDeviceConfig = {
    /**
     * - Array of alarm strings in comma-separated format (e.g., '1111111,1100,5WsQg,,,8')
     */
    alarms: string[];
    /**
     * - Ambient light color (hex code)
     */
    ambientColour: string;
    /**
     * - Bluetooth enabled state ('0' or '1')
     */
    bluetoothEnabled: string;
    /**
     * - Bluetooth headphones enabled
     */
    btHeadphonesEnabled: boolean;
    /**
     * - Clock face style (e.g., 'digital-sun')
     */
    clockFace: string;
    /**
     * - Day display brightness (e.g., 'auto', '0' - '100')
     */
    dayDisplayBrightness: string;
    /**
     * - Day mode start time (e.g., '07:00')
     */
    dayTime: string;
    /**
     * - Day mode Yoto Daily card path
     */
    dayYotoDaily: string;
    /**
     * - Day mode Yoto Radio card path
     */
    dayYotoRadio: string;
    /**
     * - Day sounds off setting ('0' or '1') (undocumented)
     */
    daySoundsOff: string;
    /**
     * - Display dim brightness level (undocumented)
     */
    displayDimBrightness: string;
    /**
     * - Display dim timeout in seconds
     */
    displayDimTimeout: string;
    /**
     * - Whether headphones volume is limited
     */
    headphonesVolumeLimited: boolean;
    /**
     * - Hour format ('12' or '24') (undocumented)
     */
    hourFormat: string;
    /**
     * - Log level (e.g., 'none') (undocumented)
     */
    logLevel: string;
    /**
     * - Device locale (e.g., 'en') (undocumented)
     */
    locale: string;
    /**
     * - Maximum volume limit
     */
    maxVolumeLimit: string;
    /**
     * - Night ambient light color (hex code)
     */
    nightAmbientColour: string;
    /**
     * - Night display brightness (e.g., 'auto', '0' - '100')
     */
    nightDisplayBrightness: string;
    /**
     * - Night maximum volume limit
     */
    nightMaxVolumeLimit: string;
    /**
     * - Night mode start time (e.g., '19:20')
     */
    nightTime: string;
    /**
     * - Night mode Yoto Daily card path
     */
    nightYotoDaily: string;
    /**
     * - Night mode Yoto Radio card path (can be '0' for none)
     */
    nightYotoRadio: string;
    /**
     * - Night sounds off setting ('0' or '1') (undocumented)
     */
    nightSoundsOff: string;
    /**
     * - Pause on power button press (undocumented)
     */
    pausePowerButton: boolean;
    /**
     * - Pause on volume down (undocumented)
     */
    pauseVolumeDown: boolean;
    /**
     * - Whether repeat all is enabled
     */
    repeatAll: boolean;
    /**
     * - Show diagnostics (undocumented)
     */
    showDiagnostics: boolean;
    /**
     * - Shutdown timeout in seconds
     */
    shutdownTimeout: string;
    /**
     * - System volume level (e.g., '100') (undocumented)
     */
    systemVolume: string;
    /**
     * - Timezone setting (empty string if not set) (undocumented)
     */
    timezone: string;
    /**
     * - Volume level preset (e.g., 'safe') (undocumented)
     */
    volumeLevel: string;
};
export type YotoDeviceShortcuts = {
    /**
     * - Shortcut modes for day and night
     */
    modes: YotoShortcutModes;
    /**
     * - Shortcuts configuration version ID
     */
    versionId: string;
};
export type YotoShortcutModes = {
    /**
     * - Day mode shortcuts
     */
    day: YotoShortcutMode;
    /**
     * - Night mode shortcuts
     */
    night: YotoShortcutMode;
};
export type YotoShortcutMode = {
    /**
     * - Array of shortcut content commands
     */
    content: YotoShortcutContent[];
};
export type YotoShortcutContent = {
    /**
     * - Command type (e.g., 'track-play')
     */
    cmd: string;
    /**
     * - Command parameters
     */
    params: YotoShortcutParams;
};
export type YotoShortcutParams = {
    /**
     * - Card ID
     */
    card: string;
    /**
     * - Chapter identifier
     */
    chapter: string;
    /**
     * - Track identifier
     */
    track: string;
};
export type YotoUpdateDeviceConfigRequest = {
    /**
     * - Device name
     */
    name?: string;
    /**
     * - Configuration settings to update (all fields optional)
     */
    config: Partial<YotoDeviceConfig>;
};
export type YotoUpdateDeviceConfigResponse = {
    /**
     * - Status of the update operation (e.g., 'ok')
     */
    status: string;
};
export type YotoUpdateShortcutsRequest = {
    /**
     * - Shortcuts configuration to update
     */
    shortcuts: YotoDeviceShortcuts;
};
export type YotoUpdateShortcutsResponse = {
    /**
     * - Status of the update operation (e.g., 'ok')
     */
    status: string;
};
export type YotoDeviceCommandResponse = {
    /**
     * - Status of the command (e.g., 'ok')
     */
    status: string;
};
/**
 * MQTT command types that can be sent to a device.
 * Uses command types from the mqtt module.
 */
export type YotoDeviceCommand = YotoVolumeCommand | YotoAmbientCommand | YotoSleepTimerCommand | YotoCardStartCommand | YotoBluetoothCommand | YotoDisplayPreviewCommand | {};
import type { YotoVolumeCommand } from '../mqtt/commands.js';
import type { YotoAmbientCommand } from '../mqtt/commands.js';
import type { YotoSleepTimerCommand } from '../mqtt/commands.js';
import type { YotoCardStartCommand } from '../mqtt/commands.js';
import type { YotoBluetoothCommand } from '../mqtt/commands.js';
import type { YotoDisplayPreviewCommand } from '../mqtt/commands.js';
//# sourceMappingURL=devices.d.ts.map