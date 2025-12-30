#!/usr/bin/env node

// This (specific) CLI is a vibecoded prototype, please don't rely on this.

/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 * @import { YotoDeviceModel } from '../lib/yoto-device.js'
 */

import { Screen, Box, Text, Line, NodeRuntime, setRuntime } from '@unblessed/node'
import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { pkg } from '../lib/pkg.cjs'
import {
  getCommonOptions,
  loadTokensFromEnv,
  handleCliError
} from './lib/cli-helpers.js'
import { saveTokensToEnv } from './lib/token-helpers.js'
import { YotoAccount } from '../lib/yoto-account.js'
import { getNightlightColorName } from '../lib/yoto-device.js'

// Initialize the unblessed runtime before using any widgets
setRuntime(new NodeRuntime())

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  'poll-interval': {
    type: 'string',
    short: 'p',
    help: 'HTTP polling interval in milliseconds (default: 600000 / 10 minutes)'
  },
  duration: {
    type: 'string',
    short: 't',
    help: 'How long to run in seconds (default: run indefinitely)'
  }
}

const args = parseArgs({ options, strict: false, allowPositionals: true })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-device-tui',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto Device TUI - Interactive multi-device monitor

    Examples:
      ${name}                                  # Monitor all devices
      ${name} --duration 60                    # Run for 60 seconds
      ${name} --poll-interval 300000           # Poll every 5 minutes

    Controls:
      Arrow keys  - Navigate between devices
      Enter       - View device details
      Escape/b    - Return to overview
      q/Ctrl+C    - Quit
`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const pollInterval = args.values['poll-interval'] ? Number(args.values['poll-interval']) : 600000
const duration = args.values['duration'] ? Number(args.values['duration']) : null

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format seconds to MM:SS
 * @param {number | null | undefined} seconds
 * @returns {string}
 */
function formatTime (seconds) {
  if (seconds == null || seconds < 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get battery display with charging indicator
 * @param {number | null} level
 * @param {boolean | null} charging
 * @returns {string}
 */
function formatBattery (level, charging) {
  if (level == null) return '??%'
  const icon = charging ? '⚡' : '🔋'
  return `${icon} ${level}%`
}

/**
 * Get compact battery display
 * @param {number | null} level
 * @param {boolean | null} charging
 * @returns {string}
 */
function formatBatteryCompact (level, charging) {
  if (level == null) return '??%'
  const icon = charging ? '⚡' : ''
  return `${icon}${level}%`
}

/**
 * Get volume bar display
 * @param {number | null} volume
 * @param {number | null} maxVolume
 * @returns {string}
 */
function formatVolume (volume, maxVolume) {
  if (volume == null) return '🔊 --/--'
  const max = maxVolume ?? 16
  const filled = Math.round((volume / 16) * 10)
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
  return `🔊 [${bar}] ${volume}/${max}`
}

/**
 * Get compact volume display
 * @param {number | null} volume
 * @returns {string}
 */
function formatVolumeCompact (volume) {
  if (volume == null) return 'Vol:--'
  return `Vol:${volume}`
}

/**
 * Get playback status icon
 * @param {string | null} status
 * @param {string | null} [cardId]
 * @returns {string}
 */
function getPlaybackIcon (status, cardId) {
  // No card = ejected (cardId can be null or undefined)
  const hasCard = cardId !== null
  if (!hasCard && status !== 'playing' && status !== 'paused') {
    return '⏏️'
  }
  switch (status) {
    case 'playing': return '▶️'
    case 'paused': return '⏸️'
    case 'stopped': return '⏹️'
    default: return '⏹️'
  }
}

/**
 * Get power source display
 * @param {'battery' | 'dock' | 'usb-c' | 'wireless'} source
 * @returns {string}
 */
function formatPowerSource (source) {
  switch (source) {
    case 'battery': return 'Battery'
    case 'dock': return 'Dock'
    case 'usb-c': return 'USB-C'
    case 'wireless': return 'Wireless'
    default: return 'Unknown'
  }
}

/**
 * Get day mode display
 * @param {'unknown' | 'night' | 'day'} mode
 * @returns {string}
 */
function formatDayMode (mode) {
  switch (mode) {
    case 'night': return '🌙 Night'
    case 'day': return '☀️ Day'
    default: return '❓ Unknown'
  }
}

/**
 * Get compact day mode
 * @param {'unknown' | 'night' | 'day'} mode
 * @returns {string}
 */
function formatDayModeCompact (mode) {
  switch (mode) {
    case 'night': return '🌙'
    case 'day': return '☀️'
    default: return '❓'
  }
}

/**
 * Get nightlight display with color name
 * @param {string} mode
 * @returns {string}
 */
function formatNightlight (mode) {
  const colorName = getNightlightColorName(mode)
  if (mode === 'off') {
    return '💡 Off (screen up)'
  } else if (mode === '0x000000') {
    return '🌑 No Light (screen down)'
  } else {
    return `💡 ${colorName}`
  }
}

/**
 * Get card insertion state display
 * @param {'none' | 'physical' | 'remote'} state
 * @returns {string}
 */
function formatCardInsertion (state) {
  switch (state) {
    case 'none': return '⏏️  No Card'
    case 'physical': return '💿 Physical'
    case 'remote': return '☁️  Remote'
    default: return '❓ Unknown'
  }
}

// ============================================================================
// Device Card Component (for overview)
// ============================================================================

/**
 * @typedef {Object} DeviceCard
 * @property {Box} box
 * @property {Text} nameText
 * @property {Text} statusText
 * @property {Text} batteryText
 * @property {Text} playbackText
 * @property {YotoDeviceModel} model
 * @property {number} index
 */

/**
 * Create a device card for the overview
 * @param {Box} parent
 * @param {YotoDeviceModel} model
 * @param {number} index
 * @param {number} row
 * @param {number} col
 * @param {boolean} selected
 * @returns {DeviceCard}
 */
function createDeviceCard (parent, model, index, row, col, selected) {
  const cardWidth = 28
  const cardHeight = 8
  const left = 1 + col * (cardWidth + 1)
  const top = 1 + row * (cardHeight + 1)

  const box = new Box({
    parent,
    top,
    left,
    width: cardWidth,
    height: cardHeight,
    border: { type: 'line' },
    tags: true,
    style: {
      fg: 'white',
      bg: '#1a1a2e',
      border: { fg: selected ? '#ffcc00' : '#4a90d9' }
    }
  })

  const nameText = new Text({
    parent: box,
    top: 0,
    left: 1,
    width: cardWidth - 4,
    content: `{bold}${model.device.name.substring(0, cardWidth - 6)}{/bold}`,
    tags: true,
    style: { fg: selected ? '#ffcc00' : '#4a90d9', bg: '#1a1a2e' }
  })

  const statusText = new Text({
    parent: box,
    top: 1,
    left: 1,
    width: cardWidth - 4,
    content: '📡 --  🔌 --',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const batteryText = new Text({
    parent: box,
    top: 2,
    left: 1,
    width: cardWidth - 4,
    content: '🔋 --% | Vol:--',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const playbackText = new Text({
    parent: box,
    top: 4,
    left: 1,
    width: cardWidth - 4,
    content: '⏹️ --',
    tags: true,
    style: { fg: '#888888', bg: '#1a1a2e' }
  })

  return { box, nameText, statusText, batteryText, playbackText, model, index }
}

/**
 * Update a device card display
 * @param {DeviceCard} card
 * @param {boolean} selected
 */
function updateDeviceCard (card, selected) {
  const { model, box, nameText, statusText, batteryText, playbackText } = card
  const status = model.status
  const playback = model.playback

  // Update selection style
  if (box.style.border) {
    box.style.border.fg = selected ? '#ffcc00' : '#4a90d9'
  }
  nameText.style.fg = selected ? '#ffcc00' : '#4a90d9'

  // Connection status
  const onlineIcon = model.deviceOnline ? '{green-fg}●{/green-fg}' : '{red-fg}●{/red-fg}'
  const mqttIcon = model.mqttConnected ? '{green-fg}●{/green-fg}' : '{red-fg}●{/red-fg}'
  statusText.setContent(`📡${onlineIcon} 🔌${mqttIcon} ${formatDayModeCompact(status.dayMode)}`)

  // Battery & Volume
  const batteryStr = formatBatteryCompact(status.batteryLevelPercentage, status.isCharging)
  const volStr = formatVolumeCompact(status.volume)
  batteryText.setContent(`🔋${batteryStr} | ${volStr}`)

  // Playback
  const playIcon = getPlaybackIcon(playback.playbackStatus, playback.cardId)
  const track = playback.trackTitle || 'Stopped'
  playbackText.setContent(`${playIcon} ${track.substring(0, 20)}`)
}

// ============================================================================
// Detail View Component
// ============================================================================

/**
 * @typedef {Object} DetailView
 * @property {Box} container
 * @property {Box} deviceBox
 * @property {Text} connectionText
 * @property {Text} batteryText
 * @property {Text} volumeText
 * @property {Text} modeText
 * @property {Text} tempText
 * @property {Text} playbackHeader
 * @property {Text} trackText
 * @property {Text} chapterText
 * @property {Text} progressText
 * @property {Text} cardText
 * @property {Box} logBox
 * @property {string[]} logLines
 * @property {YotoDeviceModel | null} model
 */

/**
 * Create the detail view
 * @param {Screen} screen
 * @returns {DetailView}
 */
function createDetailView (screen) {
  const container = new Box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    hidden: true,
    style: { fg: 'white', bg: 'black' }
  })

  const deviceBox = new Box({
    parent: container,
    top: 1,
    left: 'center',
    width: 50,
    height: 18,
    border: { type: 'line' },
    tags: true,
    style: {
      fg: 'white',
      bg: '#1a1a2e',
      border: { fg: '#4a90d9' }
    }
  })

  /* eslint-disable-next-line no-new */
  new Line({
    parent: deviceBox,
    top: 2,
    left: 0,
    width: 48,
    orientation: 'horizontal',
    style: { fg: '#4a90d9' }
  })

  const connectionText = new Text({
    parent: deviceBox,
    top: 3,
    left: 2,
    content: '📡 Online: --  |  🔌 MQTT: --',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const batteryText = new Text({
    parent: deviceBox,
    top: 5,
    left: 2,
    content: '🔋 --% | Power: --',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const volumeText = new Text({
    parent: deviceBox,
    top: 6,
    left: 2,
    content: '🔊 [░░░░░░░░░░] --/--',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const modeText = new Text({
    parent: deviceBox,
    top: 7,
    left: 2,
    content: '☀️ --  |  📶 -- dBm',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const tempText = new Text({
    parent: deviceBox,
    top: 8,
    left: 2,
    content: '🌡️ --°C',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  /* eslint-disable-next-line no-new */
  new Line({
    parent: deviceBox,
    top: 9,
    left: 0,
    width: 48,
    orientation: 'horizontal',
    style: { fg: '#4a90d9' }
  })

  const playbackHeader = new Text({
    parent: deviceBox,
    top: 10,
    left: 2,
    content: '{bold}▶️ Now Playing{/bold}',
    tags: true,
    style: { fg: '#4a90d9', bg: '#1a1a2e' }
  })

  const trackText = new Text({
    parent: deviceBox,
    top: 11,
    left: 2,
    width: 44,
    content: '  Track: --',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const chapterText = new Text({
    parent: deviceBox,
    top: 12,
    left: 2,
    width: 44,
    content: '  Chapter: --',
    tags: true,
    style: { fg: '#888888', bg: '#1a1a2e' }
  })

  const progressText = new Text({
    parent: deviceBox,
    top: 13,
    left: 2,
    content: '  ⏱️ --:-- / --:--',
    tags: true,
    style: { fg: 'white', bg: '#1a1a2e' }
  })

  const cardText = new Text({
    parent: deviceBox,
    top: 14,
    left: 2,
    width: 44,
    content: '  🎴 Card: --',
    tags: true,
    style: { fg: '#666666', bg: '#1a1a2e' }
  })

  const logBox = new Box({
    parent: container,
    top: 20,
    left: 1,
    width: '100%-2',
    height: '100%-21',
    border: { type: 'line' },
    label: ' Event Log ',
    tags: true,
    style: {
      fg: 'white',
      bg: '#0a0a0a',
      border: { fg: '#333333' },
      label: { fg: '#666666' }
    }
  })

  /** @type {string[]} */
  const logLines = []

  return {
    container,
    deviceBox,
    connectionText,
    batteryText,
    volumeText,
    modeText,
    tempText,
    playbackHeader,
    trackText,
    chapterText,
    progressText,
    cardText,
    logBox,
    logLines,
    model: null
  }
}

/**
 * Update detail view header with device name
 * @param {DetailView} view
 * @param {YotoDeviceModel} model
 */
function setDetailViewModel (view, model) {
  view.model = model

  // Create header dynamically
  const headerBox = view.deviceBox.children.find(c => c._isHeader)
  if (headerBox) {
    headerBox.destroy()
  }

  const header = new Box({
    parent: view.deviceBox,
    top: 0,
    left: 'center',
    width: 46,
    height: 2,
    content: `{center}{bold}${model.device.name}{/bold}\n${model.device.deviceType}{/center}`,
    tags: true,
    style: { fg: '#4a90d9', bg: '#1a1a2e' }
  })
  // @ts-expect-error - marking for identification
  header._isHeader = true

  view.logLines.length = 0
  view.logBox.setContent('')
}

/**
 * Update the detail view display
 * @param {DetailView} view
 */
function updateDetailView (view) {
  const model = view.model
  if (!model) return

  const status = model.status
  const playback = model.playback
  const capabilities = model.capabilities

  // Connection status
  const onlineColor = model.deviceOnline ? '{green-fg}' : '{red-fg}'
  const onlineStatus = model.deviceOnline ? 'Yes' : 'No'
  const mqttColor = model.mqttConnected ? '{green-fg}' : '{red-fg}'
  const mqttStatus = model.mqttConnected ? 'Yes' : 'No'
  view.connectionText.setContent(`📡 Online: ${onlineColor}${onlineStatus}{/}  |  🔌 MQTT: ${mqttColor}${mqttStatus}{/}`)

  // Battery & Power
  const batteryStr = formatBattery(status.batteryLevelPercentage, status.isCharging)
  const powerStr = formatPowerSource(status.powerSource)
  view.batteryText.setContent(`${batteryStr} | Power: ${powerStr}`)

  // Volume
  view.volumeText.setContent(formatVolume(status.volume, status.maxVolume))

  // Day Mode & WiFi
  const modeStr = formatDayMode(status.dayMode)
  const wifiStr = status.wifiStrength != null ? `${status.wifiStrength} dBm` : '-- dBm'
  view.modeText.setContent(`${modeStr}  |  📶 ${wifiStr}`)

  // Temperature & Nightlight
  let sensorDisplay = ''
  if (capabilities.hasTemperatureSensor && status.temperatureCelsius != null) {
    sensorDisplay = `🌡️ ${status.temperatureCelsius}°C`
  }
  if (capabilities.hasColoredNightlight) {
    const nightlightStr = formatNightlight(status.nightlightMode)
    if (sensorDisplay) {
      sensorDisplay += `  |  ${nightlightStr}`
    } else {
      sensorDisplay = nightlightStr
    }
  }
  if (sensorDisplay) {
    view.tempText.setContent(sensorDisplay)
    view.tempText.show()
  } else {
    view.tempText.hide()
  }

  // Playback
  const playIcon = getPlaybackIcon(playback.playbackStatus, playback.cardId)
  view.playbackHeader.setContent(`{bold}${playIcon} ${playback.playbackStatus || 'Stopped'}{/bold}`)

  const trackTitle = playback.trackTitle || '--'
  view.trackText.setContent(`  Track: ${trackTitle.substring(0, 40)}`)

  const chapterTitle = playback.chapterTitle || '--'
  view.chapterText.setContent(`  Chapter: ${chapterTitle.substring(0, 38)}`)

  const posStr = formatTime(playback.position)
  const lenStr = formatTime(playback.trackLength)
  view.progressText.setContent(`  ⏱️ ${posStr} / ${lenStr}`)

  const cardId = playback.cardId || '--'
  const cardInsertion = formatCardInsertion(status.cardInsertionState)
  view.cardText.setContent(`  🎴 Card: ${cardId.substring(0, 36)} | ${cardInsertion}`)
}

/**
 * Log to detail view
 * @param {DetailView} view
 * @param {string} message
 * @param {string} [type]
 */
function logToDetail (view, message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString()
  let prefix = ''
  switch (type) {
    case 'status': prefix = '[STATUS]'; break
    case 'config': prefix = '[CONFIG]'; break
    case 'playback': prefix = '[PLAY]'; break
    case 'online': prefix = '[ONLINE]'; break
    case 'offline': prefix = '[OFFLINE]'; break
    case 'mqtt': prefix = '[MQTT]'; break
    case 'error': prefix = '[ERROR]'; break
    default: prefix = '[INFO]'
  }

  // Add new line
  view.logLines.push(`[${timestamp}] ${prefix} ${message}`)

  // Calculate visible lines (box height minus border)
  const visibleLines = (view.logBox.height || 10) - 2

  // Keep only the last N lines
  while (view.logLines.length > visibleLines) {
    view.logLines.shift()
  }

  // Update content
  view.logBox.setContent(view.logLines.join('\n'))
}

// ============================================================================
// Main Application
// ============================================================================

async function main () {
  // Create Screen first for loading display
  const screen = new Screen({
    smartCSR: true,
    title: 'Yoto Device Monitor',
    fullUnicode: true
  })

  // Show loading indicator
  const loadingBox = new Box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 44,
    height: 5,
    border: { type: 'line' },
    tags: true,
    content: '{center}🔄 Connecting to Yoto API...{/center}',
    valign: 'middle',
    style: {
      fg: 'white',
      bg: '#1a1a2e',
      border: { fg: '#4a90d9' }
    }
  })
  screen.render()

  // Create YotoAccount to manage all devices
  const account = new YotoAccount({
    clientOptions: {
      clientId,
      refreshToken,
      accessToken,
      onTokenRefresh: async (tokens) => {
        const { resolvedPath } = await saveTokensToEnv(envFile, {
          access_token: tokens.updatedAccessToken,
          refresh_token: tokens.updatedRefreshToken,
          token_type: 'Bearer',
          expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
        }, tokens.clientId)

        console.log(`Auth token refreshed: ${resolvedPath}`)
      }
    },
    deviceOptions: {
      httpPollIntervalMs: pollInterval
    }
  })

  // Start the account (discovers and starts all devices)
  loadingBox.setContent('{center}📡 Discovering devices...{/center}')
  screen.render()
  await account.start()

  // Hide loading indicator
  loadingBox.hide()
  loadingBox.destroy()

  // Get device models as array for UI
  /** @type {YotoDeviceModel[]} */
  const deviceModels = Array.from(account.devices.values())

  if (deviceModels.length === 0) {
    screen.destroy()
    console.error('❌ No devices found')
    await account.stop()
    process.exit(1)
  }

  // ============================================================================
  // State
  // ============================================================================

  /** @type {'overview' | 'detail'} */
  let currentView = 'overview'
  let selectedIndex = 0
  let columns = Math.max(1, Math.floor((screen.width || 80) / 30))

  // ============================================================================
  // Overview View
  // ============================================================================

  const overviewContainer = new Box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    style: { fg: 'white', bg: 'black' }
  })

  /* eslint-disable-next-line no-new */
  new Box({
    parent: overviewContainer,
    top: 0,
    left: 'center',
    width: 30,
    height: 1,
    content: '{center}{bold}Yoto Devices{/bold}{/center}',
    tags: true,
    style: { fg: '#4a90d9', bg: 'black' }
  })

  /** @type {DeviceCard[]} */
  const deviceCards = deviceModels.map((model, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    return createDeviceCard(overviewContainer, model, index, row, col, index === selectedIndex)
  })

  // ============================================================================
  // Detail View
  // ============================================================================

  const detailView = createDetailView(screen)

  // ============================================================================
  // Footer
  // ============================================================================

  const overviewFooter = new Box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' {bold}↑↓←→{/bold} Navigate | {bold}Enter{/bold} Details | {bold}q{/bold} Quit',
    tags: true,
    style: { fg: 'white', bg: '#333333' }
  })

  const detailFooter = new Box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    hidden: true,
    content: ' {bold}Esc/b{/bold} Back | {bold}r{/bold} Refresh | {bold}c{/bold} Clear Log | {bold}q{/bold} Quit',
    tags: true,
    style: { fg: 'white', bg: '#333333' }
  })

  // ============================================================================
  // View Management
  // ============================================================================

  function showOverview () {
    currentView = 'overview'
    overviewContainer.show()
    overviewFooter.show()
    detailView.container.hide()
    detailFooter.hide()
    updateOverviewDisplay()
    screen.render()
  }

  /**
   * @param {number} index
   */
  function showDetail (index) {
    currentView = 'detail'
    const model = deviceModels[index]
    if (!model) return
    setDetailViewModel(detailView, model)
    overviewContainer.hide()
    overviewFooter.hide()
    detailView.container.show()
    detailFooter.show()
    updateDetailView(detailView)
    logToDetail(detailView, `Viewing ${model.device.name}`, 'info')
    screen.render()
  }

  function updateOverviewDisplay () {
    deviceCards.forEach((card, index) => {
      updateDeviceCard(card, index === selectedIndex)
    })
  }

  /**
   * Reposition cards based on current screen width
   */
  function repositionCards () {
    const cardWidth = 28
    const cardHeight = 8
    columns = Math.max(1, Math.floor((screen.width || 80) / 30))

    deviceCards.forEach((card, index) => {
      const row = Math.floor(index / columns)
      const col = index % columns
      card.box.top = 1 + row * (cardHeight + 1)
      card.box.left = 1 + col * (cardWidth + 1)
    })
  }

  // Handle terminal resize
  screen.on('resize', () => {
    repositionCards()
    screen.render()
  })

  /**
   * @param {'up' | 'down' | 'left' | 'right'} direction
   */
  function navigateSelection (direction) {
    const oldIndex = selectedIndex

    switch (direction) {
      case 'up': {
        const newIndex = selectedIndex - columns
        if (newIndex >= 0) selectedIndex = newIndex
        break
      }
      case 'down': {
        const newIndex = selectedIndex + columns
        if (newIndex < deviceModels.length) selectedIndex = newIndex
        break
      }
      case 'left':
        if (selectedIndex > 0) selectedIndex--
        break
      case 'right':
        if (selectedIndex < deviceModels.length - 1) selectedIndex++
        break
    }

    if (oldIndex !== selectedIndex) {
      updateOverviewDisplay()
      screen.render()
    }
  }

  // ============================================================================
  // Event Handlers - Subscribe directly to device model events
  // ============================================================================

  deviceModels.forEach((model, index) => {
    const card = deviceCards[index]
    if (!card) return

    model.on('statusUpdate', (_status, source, changedFields) => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        if (changedFields && changedFields.size > 0) {
          const fields = Array.from(changedFields).join(', ')
          logToDetail(detailView, `Status via ${source}: ${fields}`, 'status')
        }
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('configUpdate', (_config, changedFields) => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        if (changedFields && changedFields.size > 0) {
          const fields = Array.from(changedFields).join(', ')
          logToDetail(detailView, `Config: ${fields}`, 'config')
        }
      }
      screen.render()
    })

    model.on('playbackUpdate', (_playback, changedFields) => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        if (changedFields && changedFields.size > 0) {
          const fields = Array.from(changedFields).join(', ')
          logToDetail(detailView, `Playback: ${fields}`, 'playback')
        }
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('online', (metadata) => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, `Device online (${metadata.reason})`, 'online')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('offline', (metadata) => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, `Device offline (${metadata.reason})`, 'offline')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('mqttConnect', () => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, 'MQTT connected', 'mqtt')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('mqttDisconnect', () => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, 'MQTT disconnected', 'mqtt')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('mqttClose', () => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, 'MQTT closed', 'mqtt')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('mqttReconnect', () => {
      updateDeviceCard(card, index === selectedIndex)

      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, 'MQTT reconnecting', 'mqtt')
        updateDetailView(detailView)
      }
      screen.render()
    })

    model.on('error', (error) => {
      if (currentView === 'detail' && detailView.model === model) {
        logToDetail(detailView, `Error: ${error.message}`, 'error')
      }
      screen.render()
    })
  })

  // ============================================================================
  // Keyboard Handlers
  // ============================================================================

  screen.key(['q', 'C-c'], async () => {
    // Always quit
    try {
      await account.stop()
    } catch {
      // Ignore shutdown errors
    }
    screen.destroy()
    process.exit(0)
  })

  screen.key(['escape', 'b'], () => {
    if (currentView === 'detail') {
      showOverview()
    }
  })

  screen.key(['enter'], () => {
    if (currentView === 'overview') {
      showDetail(selectedIndex)
    }
  })

  screen.key(['up', 'k'], () => {
    if (currentView === 'overview') {
      navigateSelection('up')
    }
  })

  screen.key(['down', 'j'], () => {
    if (currentView === 'overview') {
      navigateSelection('down')
    }
  })

  screen.key(['left', 'h'], () => {
    if (currentView === 'overview') {
      navigateSelection('left')
    }
  })

  screen.key(['right', 'l'], () => {
    if (currentView === 'overview') {
      navigateSelection('right')
    }
  })

  screen.key(['r'], async () => {
    if (currentView === 'detail' && detailView.model) {
      logToDetail(detailView, 'Refreshing config...', 'info')
      try {
        await detailView.model.refreshConfig()
        logToDetail(detailView, 'Config refreshed', 'info')
        updateDetailView(detailView)
      } catch (err) {
        const error = /** @type {Error} */ (err)
        logToDetail(detailView, `Refresh failed: ${error.message}`, 'error')
      }
      screen.render()
    }
  })

  screen.key(['c'], () => {
    if (currentView === 'detail') {
      detailView.logBox.setContent('')
      logToDetail(detailView, 'Log cleared', 'info')
      screen.render()
    }
  })

  // ============================================================================
  // Auto-stop timer
  // ============================================================================

  if (duration) {
    setTimeout(async () => {
      try {
        await account.stop()
      } catch {
        // Ignore shutdown errors
      }
      screen.destroy()
      process.exit(0)
    }, duration * 1000)
  }

  // ============================================================================
  // Initial render (devices already started by account.start())
  // ============================================================================

  updateOverviewDisplay()
  screen.render()

  // Set focus to screen to enable keyboard input
  screen.focusPush(overviewContainer)
}

// Run the main function
await main().catch((err) => {
  handleCliError(err)
})
