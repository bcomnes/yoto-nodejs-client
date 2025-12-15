/**
 * MQTT Command Builders for Yoto Players
 *
 * Type-safe builders for constructing MQTT command payloads
 * @see https://yoto.dev/players-mqtt/
 */

// ============================================================================
// MQTT Commands: Type-safe command builders
// ============================================================================

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
export function createVolumeCommand (volume) {
  if (volume < 0 || volume > 100) {
    throw new Error('Volume must be between 0 and 100')
  }

  return { volume }
}

/**
 * Create an ambient light set command
 * @param {number} r - Red intensity [0-255]
 * @param {number} g - Green intensity [0-255]
 * @param {number} b - Blue intensity [0-255]
 * @returns {YotoAmbientCommand}
 * @throws {Error} If any color value is out of range
 */
export function createAmbientCommand (r, g, b) {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new Error('RGB values must be between 0 and 255')
  }

  return { r, g, b }
}

/**
 * Create an ambient light command from hex color
 * @param {string} hexColor - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns {YotoAmbientCommand}
 * @throws {Error} If hex color is invalid
 */
export function createAmbientCommandFromHex (hexColor) {
  // Remove # if present
  const hex = hexColor.replace(/^#/, '')

  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid hex color format. Expected format: #RRGGBB or RRGGBB')
  }

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return { r, g, b }
}

/**
 * Create a sleep timer set command
 * @param {number} seconds - Timer duration in seconds (0 to disable)
 * @returns {YotoSleepTimerCommand}
 * @throws {Error} If seconds is negative
 */
export function createSleepTimerCommand (seconds) {
  if (seconds < 0) {
    throw new Error('Seconds must be non-negative (use 0 to disable timer)')
  }

  return { seconds }
}

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
export function createCardStartCommand (options) {
  if (!options.uri) {
    throw new Error('Card URI is required')
  }

  /** @type {YotoCardStartCommand} */
  const command = { uri: options.uri }

  if (options.chapterKey !== undefined) command.chapterKey = options.chapterKey
  if (options.trackKey !== undefined) command.trackKey = options.trackKey
  if (options.secondsIn !== undefined) command.secondsIn = options.secondsIn
  if (options.cutOff !== undefined) command.cutOff = options.cutOff
  if (options.anyButtonStop !== undefined) command.anyButtonStop = options.anyButtonStop

  return command
}

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
export function createBluetoothOnCommand (options = {}) {
  /** @type {YotoBluetoothCommand} */
  const command = {}

  if (options.action !== undefined) command.action = options.action
  if (options.mode !== undefined) command.mode = options.mode
  if (options.rssi !== undefined) command.rssi = options.rssi
  if (options.name !== undefined) command.name = options.name
  if (options.mac !== undefined) command.mac = options.mac

  return command
}

/**
 * Create a bluetooth speaker mode command
 * @returns {YotoBluetoothCommand}
 */
export function createBluetoothSpeakerCommand () {
  return { mode: 'bt_speaker' }
}

/**
 * Create a bluetooth audio source mode command
 * @returns {YotoBluetoothCommand}
 */
export function createBluetoothAudioSourceCommand () {
  return { action: 'on', mode: true }
}

/**
 * Create a display preview command
 * @param {Object} options - Display preview options
 * @param {string} options.uri - Filepath to icon asset
 * @param {number} options.timeout - Display duration in seconds
 * @param {boolean} options.animated - Whether icon is animated
 * @returns {YotoDisplayPreviewCommand}
 * @throws {Error} If uri or timeout is missing
 */
export function createDisplayPreviewCommand (options) {
  if (!options.uri) {
    throw new Error('Icon URI is required')
  }

  if (options.timeout === undefined) {
    throw new Error('Timeout is required')
  }

  return {
    uri: options.uri,
    timeout: options.timeout,
    animated: options.animated ? 1 : 0
  }
}

/**
 * Command builders object for convenient access
 */
export const commands = {
  volume: createVolumeCommand,
  ambient: createAmbientCommand,
  ambientFromHex: createAmbientCommandFromHex,
  sleepTimer: createSleepTimerCommand,
  cardStart: createCardStartCommand,
  bluetoothOn: createBluetoothOnCommand,
  bluetoothSpeaker: createBluetoothSpeakerCommand,
  bluetoothAudioSource: createBluetoothAudioSourceCommand,
  displayPreview: createDisplayPreviewCommand
}
