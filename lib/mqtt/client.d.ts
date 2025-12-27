/**
 * Yoto MQTT Client class
 * @extends {EventEmitter<YotoMqttClientEventMap>}
 *
 * Device automatically publishes status updates every 5 minutes when connected.
 * Status can also be requested on-demand via requestStatus() and requestEvents().
 *
 * Events:
 * - 'connect' - Connection established
 * - 'disconnect' - MQTT disconnect packet received, passes metadata with disconnect packet
 * - 'close' - Connection closed, passes metadata with close reason
 * - 'reconnect' - Reconnecting
 * - 'error' - Error occurred, passes error
 * - 'events' - Device sends events, passes (topic, payload)
 * - 'status' - Device sends status, passes (topic, payload)
 * - 'status-legacy' - Device sends legacy status with lifecycle events, passes (topic, payload)
 * - 'response' - Device responds to commands, passes (topic, payload)
 * - 'unknown' - Unknown message type received, passes (topic, payload)
 */
export class YotoMqttClient extends EventEmitter<YotoMqttClientEventMap> {
    /**
     * Create a Yoto MQTT client
     * @param {MqttClient} mqttClient - Underlying MQTT client
     * @param {string} deviceId - Device ID
     * @param {Object} [options] - Client options
     * @param {boolean} [options.autoSubscribe=true] - Auto-subscribe to device topics on connect
     */
    constructor(mqttClient: MqttClient, deviceId: string, options?: {
        autoSubscribe?: boolean | undefined;
    });
    mqttClient: MqttClient;
    deviceId: string;
    autoSubscribe: boolean;
    commands: {
        volume: typeof import("./commands.js").createVolumeCommand;
        ambient: typeof import("./commands.js").createAmbientCommand;
        ambientFromHex: typeof import("./commands.js").createAmbientCommandFromHex;
        sleepTimer: typeof import("./commands.js").createSleepTimerCommand;
        cardStart: typeof import("./commands.js").createCardStartCommand;
        bluetoothOn: typeof import("./commands.js").createBluetoothOnCommand;
        bluetoothSpeaker: typeof import("./commands.js").createBluetoothSpeakerCommand;
        bluetoothAudioSource: typeof import("./commands.js").createBluetoothAudioSourceCommand;
        displayPreview: typeof import("./commands.js").createDisplayPreviewCommand;
    };
    /**
     * Get current connection state
     * @returns {YotoMqttConnectionState}
     */
    get state(): YotoMqttConnectionState;
    /**
     * Check if client is connected
     * @returns {boolean}
     */
    get connected(): boolean;
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
    subscribe(types?: Array<"events" | "status" | "response"> | "all"): Promise<void>;
    /**
     * Connect to MQTT broker
     * @returns {Promise<void>}
     */
    connect(): Promise<void>;
    /**
     * Disconnect from MQTT broker
     * @returns {Promise<void>}
     */
    disconnect(): Promise<void>;
    /**
     * Request current events from device
     * @param {string} [body=''] - Optional request body for tracking/identification
     * @returns {Promise<void>}
     */
    requestEvents(body?: string): Promise<void>;
    /**
     * Request current status from device
     * @param {string} [body=''] - Optional request body for tracking/identification
     * @returns {Promise<void>}
     */
    requestStatus(body?: string): Promise<void>;
    /**
     * Set device volume
     * @param {number} volume - Volume level [0-100]
     * @returns {Promise<void>}
     */
    setVolume(volume: number): Promise<void>;
    /**
     * Set ambient light color
     * @param {number} r - Red intensity [0-255]
     * @param {number} g - Green intensity [0-255]
     * @param {number} b - Blue intensity [0-255]
     * @returns {Promise<void>}
     */
    setAmbient(r: number, g: number, b: number): Promise<void>;
    /**
     * Set ambient light color from hex
     * @param {string} hexColor - Hex color string (e.g., "#FF0000")
     * @returns {Promise<void>}
     */
    setAmbientHex(hexColor: string): Promise<void>;
    /**
     * Set sleep timer
     * @param {number} seconds - Timer duration in seconds (0 to disable)
     * @returns {Promise<void>}
     */
    setSleepTimer(seconds: number): Promise<void>;
    /**
     * Reboot device
     * @returns {Promise<void>}
     */
    reboot(): Promise<void>;
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
    startCard(options: {
        uri: string;
        chapterKey?: string | undefined;
        trackKey?: string | undefined;
        secondsIn?: number | undefined;
        cutOff?: number | undefined;
        anyButtonStop?: boolean | undefined;
    }): Promise<void>;
    /**
     * Stop card playback
     * @returns {Promise<void>}
     */
    stopCard(): Promise<void>;
    /**
     * Pause card playback
     * @returns {Promise<void>}
     */
    pauseCard(): Promise<void>;
    /**
     * Resume card playback
     * @returns {Promise<void>}
     */
    resumeCard(): Promise<void>;
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
    bluetoothOn(options?: {
        action?: string | undefined;
        mode?: string | boolean | undefined;
        rssi?: number | undefined;
        name?: string | undefined;
        mac?: string | undefined;
    }): Promise<void>;
    /**
     * Turn Bluetooth off
     * @returns {Promise<void>}
     */
    bluetoothOff(): Promise<void>;
    /**
     * Enable Bluetooth speaker mode
     * @returns {Promise<void>}
     */
    bluetoothSpeakerMode(): Promise<void>;
    /**
     * Enable Bluetooth audio source mode
     * @returns {Promise<void>}
     */
    bluetoothAudioSourceMode(): Promise<void>;
    /**
     * Delete all Bluetooth bonds
     * @returns {Promise<void>}
     */
    bluetoothDeleteBonds(): Promise<void>;
    /**
     * Connect to Bluetooth device
     * @returns {Promise<void>}
     */
    bluetoothConnect(): Promise<void>;
    /**
     * Disconnect Bluetooth device
     * @returns {Promise<void>}
     */
    bluetoothDisconnect(): Promise<void>;
    /**
     * Get Bluetooth state
     * @returns {Promise<void>}
     */
    bluetoothGetState(): Promise<void>;
    /**
     * Preview display icon
     * @param {Object} options - Display preview options
     * @param {string} options.uri - Icon URI
     * @param {number} options.timeout - Display duration in seconds
     * @param {boolean} options.animated - Whether icon is animated
     * @returns {Promise<void>}
     */
    displayPreview(options: {
        uri: string;
        timeout: number;
        animated: boolean;
    }): Promise<void>;
    #private;
}
/**
 * MQTT disconnect event metadata (from MQTT disconnect packet)
 */
export type YotoMqttClientDisconnectMetadata = {
    /**
     * - MQTT disconnect packet
     */
    packet: IDisconnectPacket;
};
/**
 * MQTT close event metadata (from connection close)
 */
export type YotoMqttClientCloseMetadata = {
    /**
     * - Close reason
     */
    reason: "close";
};
/**
 * Event map for YotoMqttClient
 */
export type YotoMqttClientEventMap = {
    "connect": [];
    "disconnect": [YotoMqttClientDisconnectMetadata];
    "close": [YotoMqttClientCloseMetadata];
    "reconnect": [];
    "error": [Error];
    "events": [string, YotoEventsMessage];
    "status": [string, YotoStatusMessage];
    "status-legacy": [string, YotoStatusLegacyMessage];
    "response": [string, YotoResponseMessage];
    "unknown": [string, any];
};
/**
 * Events message from device
 * Note: Messages are partial - only changed fields are included
 */
export type YotoEventsMessage = {
    /**
     * - Repeat all tracks
     */
    repeatAll?: boolean;
    /**
     * - Whether streaming
     */
    streaming?: boolean;
    /**
     * - Current user volume level (0-16 scale, maps to userVolumePercentage in status)
     */
    volume?: number;
    /**
     * - Maximum volume limit (0-16 scale, maps to systemVolumePercentage in status)
     */
    volumeMax?: number;
    /**
     * - Playback waiting
     */
    playbackWait?: boolean;
    /**
     * - Sleep timer active
     */
    sleepTimerActive?: boolean;
    /**
     * - Unix timestamp
     */
    eventUtc?: number;
    /**
     * - Track duration in seconds
     */
    trackLength?: number;
    /**
     * - Current position in seconds
     */
    position?: number;
    /**
     * - Currently playing card ID
     */
    cardId?: string;
    /**
     * - Source of playback (e.g., "card", "remote", "MQTT")
     */
    source?: string;
    /**
     * - ISO8601 format timestamp
     */
    cardUpdatedAt?: string;
    /**
     * - Current chapter title
     */
    chapterTitle?: string;
    /**
     * - Current chapter key
     */
    chapterKey?: string;
    /**
     * - Current track title
     */
    trackTitle?: string;
    /**
     * - Current track key
     */
    trackKey?: string;
    /**
     * - Playback status
     */
    playbackStatus?: "playing" | "paused" | "stopped" | "loading" | string;
    /**
     * - Seconds remaining on sleep timer
     */
    sleepTimerSeconds?: number;
};
/**
 * Status message from device (MQTT /data/status)
 *
 * Device automatically publishes status updates every 5 minutes (matching keepalive interval).
 * Can also be requested on-demand via requestStatus().
 *
 * Note: MQTT types differ from HTTP - uses booleans, non-nullable fields
 */
export type YotoStatusMessage = {
    /**
     * - Status object
     */
    status: YotoMqttStatus;
};
/**
 * MQTT status payload structure (documented spec)
 *
 * Automatic updates (every 5 minutes): 21 fields (excludes nightlightMode and temp)
 * Requested status: All 23 fields including nightlightMode and temp
 */
export type YotoMqttStatus = {
    /**
     * - Status message version
     */
    statusVersion: number;
    /**
     * - Firmware version
     */
    fwVersion: string;
    /**
     * - Product type identifier
     */
    productType: string;
    /**
     * - Battery level percentage
     */
    batteryLevel: number;
    /**
     * - Ambient light sensor reading
     */
    als: number;
    /**
     * - Free disk space in bytes
     */
    freeDisk: number;
    /**
     * - Shutdown timeout in seconds
     */
    shutdownTimeout: number;
    /**
     * - DBAT timeout
     */
    dbatTimeout: number;
    /**
     * - Charging state (0 or 1)
     */
    charging: number;
    /**
     * - Active card ID or 'none'
     */
    activeCard: string;
    /**
     * - Card insertion state (0=none, 1=physical, 2=remote)
     */
    cardInserted: 0 | 1 | 2;
    /**
     * - Playing status code
     */
    playingStatus: number;
    /**
     * - Headphones connected
     */
    headphones: boolean;
    /**
     * - Current display brightness (Integer 0-100)
     */
    dnowBrightness: number;
    /**
     * - Day brightness setting (Integer 0-100)
     */
    dayBright: number;
    /**
     * - Night brightness setting (Integer 0-100)
     */
    nightBright: number;
    /**
     * - Bluetooth headphones enabled
     */
    bluetoothHp: boolean;
    /**
     * - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
     */
    volume: number;
    /**
     * - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
     */
    userVolume: number;
    /**
     * - Time format preference
     */
    timeFormat: "12" | "24";
    /**
     * - Current nightlight color (actual hex color like '0xff5733' or 'off') - only in requested status, most accurate source
     */
    nightlightMode?: string;
    /**
     * - Temperature reading (format varies: 'value1:value2:value3' or 'value1:notSupported') - only in requested status
     */
    temp?: string;
    /**
     * - Day mode (0=night, 1=day, -1=unknown)
     */
    day: -1 | 0 | 1;
};
/**
 * Response message from device
 */
export type YotoResponseMessage = {
    /**
     * - Status object with dynamic resource keys
     */
    status: {
        volume?: "OK" | "FAIL" | undefined;
        ambients?: "OK" | "FAIL" | undefined;
        card?: "OK" | "FAIL" | undefined;
        events?: "OK" | "FAIL" | undefined;
        status?: "OK" | "FAIL" | undefined;
        bluetooth?: "OK" | "FAIL" | undefined;
        display?: "OK" | "FAIL" | undefined;
        reboot?: "OK" | "FAIL" | undefined;
        req_body: string;
        sleepTimer: "OK" | "FAIL";
    };
};
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
 */
export type YotoStatusLegacyMessage = {
    /**
     * - Legacy status object with full hardware details
     */
    status: YotoLegacyStatus;
};
/**
 * Legacy MQTT status payload structure (undocumented)
 *
 * Contains all fields from documented status plus additional lifecycle and diagnostic fields.
 */
export type YotoLegacyStatus = {
    /**
     * - Status message version
     */
    statusVersion: number;
    /**
     * - Firmware version
     */
    fwVersion: string;
    /**
     * - Power state: 'nA' = device running, any other value = shutting down/shut down (e.g., 'userShutdown') - ONLY in legacy topic
     */
    shutDown: string;
    /**
     * - Total disk space in bytes
     */
    totalDisk: number;
    /**
     * - Product type identifier
     */
    productType: string;
    /**
     * - WiFi signal strength in dBm
     */
    wifiStrength: number;
    /**
     * - WiFi SSID
     */
    ssid: string;
    /**
     * - RTC reset reason (PRO)
     */
    rtcResetReasonPRO: number;
    /**
     * - RTC reset reason (APP)
     */
    rtcResetReasonAPP: number;
    /**
     * - RTC wakeup cause code
     */
    rtcWakeupCause: number;
    /**
     * - ESP reset reason code
     */
    espResetReason: number;
    /**
     * - SD card information string
     */
    sd_info: string;
    /**
     * - Raw battery voltage in millivolts
     */
    battery: number;
    /**
     * - Power capabilities
     */
    powerCaps: string;
    /**
     * - Battery level percentage
     */
    batteryLevel: number;
    /**
     * - Battery temperature
     */
    batteryTemp: number;
    /**
     * - Battery data string (format: 'val1:val2:val3')
     */
    batteryData: string;
    /**
     * - Raw battery level reading
     */
    batteryLevelRaw: number;
    /**
     * - Free memory in bytes
     */
    free: number;
    /**
     * - Free DMA memory in bytes
     */
    freeDMA: number;
    /**
     * - Free 32-bit memory in bytes
     */
    free32: number;
    /**
     * - Device uptime in seconds (low values indicate recent startup)
     */
    upTime: number;
    /**
     * - UTC timestamp (0 indicates fresh startup before time sync)
     */
    utcTime: number;
    /**
     * - Total alive time in seconds
     */
    aliveTime: number;
    /**
     * - Accelerometer temperature in Celsius
     */
    accelTemp: number;
    /**
     * - Battery profile identifier
     */
    batteryProfile: string;
    /**
     * - Free disk space in bytes
     */
    freeDisk: number;
    /**
     * - Failure reason code
     */
    failReason: number;
    /**
     * - Failure data
     */
    failData: number;
    /**
     * - Shutdown timeout in seconds
     */
    shutdownTimeout: number;
    /**
     * - UTC offset in seconds
     */
    utcOffset: number;
    /**
     * - NFC error rates (format: 'xx.xx%-xx.xx%')
     */
    nfcErrs: string;
    /**
     * - DBAT timeout in seconds
     */
    dbatTimeout: number;
    /**
     * - Charging state (0 or 1)
     */
    charging: number;
    /**
     * - Power source (0=battery, 1=V2 dock, 2=USB-C, 3=Qi)
     */
    powerSrc: 0 | 1 | 2 | 3;
    /**
     * - Active card ID or 'none'
     */
    activeCard: string;
    /**
     * - Card insertion state (0=none, 1=physical, 2=remote)
     */
    cardInserted: 0 | 1 | 2;
    /**
     * - Playing status code
     */
    playingStatus: number;
    /**
     * - Headphones connected (0 or 1)
     */
    headphones: number;
    /**
     * - WiFi restart count
     */
    wifiRestarts: number;
    /**
     * - Qi OTP value
     */
    qiOtp: number;
    /**
     * - Buzzer error count
     */
    buzzErrors: number;
    /**
     * - Current display brightness (0-100, actual value)
     */
    dnowBrightness: number;
    /**
     * - Day brightness setting (0-100, 255 when configed to 'auto')
     */
    dayBright: number;
    /**
     * - Night brightness setting (0-100, 255 when configed to 'auto')
     */
    nightBright: number;
    /**
     * - Number of errors logged
     */
    errorsLogged: number;
    /**
     * - Task watchdog timer value
     */
    twdt: number;
    /**
     * - Bluetooth headphones state (0 or 1)
     */
    bluetoothHp: number;
    /**
     * - Current nightlight color (hex color like '0xff5733' or 'off')
     */
    nightlightMode: string;
    /**
     * - Background download state
     */
    bgDownload: number;
    /**
     * - Bytes per second
     */
    bytesPS: number;
    /**
     * - Day mode (0=night, 1=day, -1=unknown)
     */
    day: -1 | 0 | 1;
    /**
     * - Temperature readings (format: 'val1:val2:val3')
     */
    temp: string;
    /**
     * - Ambient light sensor reading
     */
    als: number;
    /**
     * - System/max volume level (0-100 percentage, represents 0-16 hardware scale, maps to volumeMax in events)
     */
    volume: number;
    /**
     * - User volume setting (0-100 percentage, represents 0-16 hardware scale, maps to volume in events)
     */
    userVolume: number;
    /**
     * - Time format preference
     */
    timeFormat: "12" | "24";
    /**
     * - Charge state level
     */
    chgStatLevel: number;
    /**
     * - Missed log count
     */
    missedLogs: number;
    /**
     * - NFC lock state
     */
    nfcLock: number;
    /**
     * - Battery full percentage threshold
     */
    batteryFullPct: number;
};
/**
 * MQTT connection state
 */
export type YotoMqttConnectionState = "disconnected" | "connected" | "reconnecting";
/**
 * Events message callback
 */
export type EventsCallback = (topic: string, payload: YotoEventsMessage) => any;
/**
 * Status message callback
 */
export type StatusCallback = (topic: string, payload: YotoStatusMessage) => any;
/**
 * Legacy status message callback
 */
export type StatusLegacyCallback = (topic: string, payload: YotoStatusLegacyMessage) => any;
/**
 * Response message callback
 */
export type ResponseCallback = (topic: string, payload: YotoResponseMessage) => any;
/**
 * Unknown message callback
 */
export type UnknownCallback = (topic: string, payload: any) => any;
import { EventEmitter } from 'events';
import type { MqttClient } from 'mqtt';
import type { IDisconnectPacket } from 'mqtt';
//# sourceMappingURL=client.d.ts.map