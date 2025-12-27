/**
 * MQTT Command Builders for Yoto Players
 *
 * Type-safe builders for constructing MQTT command payloads
 * @see https://yoto.dev/players-mqtt/
 */
/**
 * Volume command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommandvolumeset
 * @typedef {Object} YotoVolumeCommand
 * @property {number} volume - Volume level [0-100]
 */
/**
 * Ambient light command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommandambientsset
 * @typedef {Object} YotoAmbientCommand
 * @property {number} r - Red intensity [0-255]
 * @property {number} g - Green intensity [0-255]
 * @property {number} b - Blue intensity [0-255]
 */
/**
 * Sleep timer command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommandsleep-timerset
 * @typedef {Object} YotoSleepTimerCommand
 * @property {number} seconds - Timer duration in seconds (0 to disable)
 */
/**
 * Card start command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommandcardstart
 * @typedef {Object} YotoCardStartCommand
 * @property {string} uri - Card URI (e.g., "https://yoto.io/<cardID>")
 * @property {string} [chapterKey] - Chapter to start from
 * @property {string} [trackKey] - Track to start from
 * @property {number} [secondsIn] - Playback start offset in seconds
 * @property {number} [cutOff] - Playback stop offset in seconds
 * @property {boolean} [anyButtonStop] - Whether button press stops playback
 */
/**
 * Bluetooth command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommandbluetooth
 * @typedef {Object} YotoBluetoothCommand
 * @property {string} [action] - Bluetooth action (e.g., "on")
 * @property {boolean | string} [mode] - Bluetooth mode (true for audio source, "bt_speaker" for sink)
 * @property {number} [rssi] - RSSI threshold for auto-connect
 * @property {string} [name] - Target Bluetooth device name
 * @property {string} [mac] - Target Bluetooth MAC address
 */
/**
 * Display preview command payload
 * @see https://yoto.dev/players-mqtt/mqtt-docs/#deviceidcommanddisplaypreview
 * @typedef {Object} YotoDisplayPreviewCommand
 * @property {string} uri - Filepath to icon asset
 * @property {number} timeout - Display duration in seconds
 * @property {0 | 1} animated - Whether icon is animated (1) or static (0)
 */
/**
 * Create a volume set command
 * @param {number} volume - Volume level [0-100]
 * @returns {YotoVolumeCommand}
 * @throws {Error} If volume is out of range
 */
export function createVolumeCommand(volume: number): YotoVolumeCommand;
/**
 * Create an ambient light set command
 * @param {number} r - Red intensity [0-255]
 * @param {number} g - Green intensity [0-255]
 * @param {number} b - Blue intensity [0-255]
 * @returns {YotoAmbientCommand}
 * @throws {Error} If any color value is out of range
 */
export function createAmbientCommand(r: number, g: number, b: number): YotoAmbientCommand;
/**
 * Create an ambient light command from hex color
 * @param {string} hexColor - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns {YotoAmbientCommand}
 * @throws {Error} If hex color is invalid
 */
export function createAmbientCommandFromHex(hexColor: string): YotoAmbientCommand;
/**
 * Create a sleep timer set command
 * @param {number} seconds - Timer duration in seconds (0 to disable)
 * @returns {YotoSleepTimerCommand}
 * @throws {Error} If seconds is negative
 */
export function createSleepTimerCommand(seconds: number): YotoSleepTimerCommand;
/**
 * Create a card start command
 * @param {Object} options - Card start options
 * @param {string} options.uri - Card URI (e.g., "https://yoto.io/<cardID>")
 * @param {string} [options.chapterKey] - Chapter to start from
 * @param {string} [options.trackKey] - Track to start from
 * @param {number} [options.secondsIn] - Playback start offset in seconds
 * @param {number} [options.cutOff] - Playback stop offset in seconds
 * @param {boolean} [options.anyButtonStop] - Whether button press stops playback
 * @returns {YotoCardStartCommand}
 * @throws {Error} If uri is missing
 */
export function createCardStartCommand(options: {
    uri: string;
    chapterKey?: string | undefined;
    trackKey?: string | undefined;
    secondsIn?: number | undefined;
    cutOff?: number | undefined;
    anyButtonStop?: boolean | undefined;
}): YotoCardStartCommand;
/**
 * Create a bluetooth on command
 * @param {Object} [options] - Bluetooth options
 * @param {string} [options.action] - Bluetooth action (e.g., "on")
 * @param {boolean | string} [options.mode] - Bluetooth mode (true for audio source, "bt_speaker" for sink)
 * @param {number} [options.rssi] - RSSI threshold for auto-connect
 * @param {string} [options.name] - Target Bluetooth device name
 * @param {string} [options.mac] - Target Bluetooth MAC address
 * @returns {YotoBluetoothCommand}
 */
export function createBluetoothOnCommand(options?: {
    action?: string | undefined;
    mode?: string | boolean | undefined;
    rssi?: number | undefined;
    name?: string | undefined;
    mac?: string | undefined;
}): YotoBluetoothCommand;
/**
 * Create a bluetooth speaker mode command
 * @returns {YotoBluetoothCommand}
 */
export function createBluetoothSpeakerCommand(): YotoBluetoothCommand;
/**
 * Create a bluetooth audio source mode command
 * @returns {YotoBluetoothCommand}
 */
export function createBluetoothAudioSourceCommand(): YotoBluetoothCommand;
/**
 * Create a display preview command
 * @param {Object} options - Display preview options
 * @param {string} options.uri - Filepath to icon asset
 * @param {number} options.timeout - Display duration in seconds
 * @param {boolean} options.animated - Whether icon is animated
 * @returns {YotoDisplayPreviewCommand}
 * @throws {Error} If uri or timeout is missing
 */
export function createDisplayPreviewCommand(options: {
    uri: string;
    timeout: number;
    animated: boolean;
}): YotoDisplayPreviewCommand;
export namespace commands {
    export { createVolumeCommand as volume };
    export { createAmbientCommand as ambient };
    export { createAmbientCommandFromHex as ambientFromHex };
    export { createSleepTimerCommand as sleepTimer };
    export { createCardStartCommand as cardStart };
    export { createBluetoothOnCommand as bluetoothOn };
    export { createBluetoothSpeakerCommand as bluetoothSpeaker };
    export { createBluetoothAudioSourceCommand as bluetoothAudioSource };
    export { createDisplayPreviewCommand as displayPreview };
}
/**
 * Volume command payload
 */
export type YotoVolumeCommand = {
    /**
     * - Volume level [0-100]
     */
    volume: number;
};
/**
 * Ambient light command payload
 */
export type YotoAmbientCommand = {
    /**
     * - Red intensity [0-255]
     */
    r: number;
    /**
     * - Green intensity [0-255]
     */
    g: number;
    /**
     * - Blue intensity [0-255]
     */
    b: number;
};
/**
 * Sleep timer command payload
 */
export type YotoSleepTimerCommand = {
    /**
     * - Timer duration in seconds (0 to disable)
     */
    seconds: number;
};
/**
 * Card start command payload
 */
export type YotoCardStartCommand = {
    /**
     * - Card URI (e.g., "https://yoto.io/<cardID>")
     */
    uri: string;
    /**
     * - Chapter to start from
     */
    chapterKey?: string;
    /**
     * - Track to start from
     */
    trackKey?: string;
    /**
     * - Playback start offset in seconds
     */
    secondsIn?: number;
    /**
     * - Playback stop offset in seconds
     */
    cutOff?: number;
    /**
     * - Whether button press stops playback
     */
    anyButtonStop?: boolean;
};
/**
 * Bluetooth command payload
 */
export type YotoBluetoothCommand = {
    /**
     * - Bluetooth action (e.g., "on")
     */
    action?: string;
    /**
     * - Bluetooth mode (true for audio source, "bt_speaker" for sink)
     */
    mode?: boolean | string;
    /**
     * - RSSI threshold for auto-connect
     */
    rssi?: number;
    /**
     * - Target Bluetooth device name
     */
    name?: string;
    /**
     * - Target Bluetooth MAC address
     */
    mac?: string;
};
/**
 * Display preview command payload
 */
export type YotoDisplayPreviewCommand = {
    /**
     * - Filepath to icon asset
     */
    uri: string;
    /**
     * - Display duration in seconds
     */
    timeout: number;
    /**
     * - Whether icon is animated (1) or static (0)
     */
    animated: 0 | 1;
};
//# sourceMappingURL=commands.d.ts.map