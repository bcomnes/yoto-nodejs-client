#!/usr/bin/env node

/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import { pkg } from '../lib/pkg.cjs'
import {
  getCommonOptions,
  loadTokensFromEnv,
  createYotoClient,
  handleCliError,
  printHeader
} from './lib/cli-helpers.js'
import { YotoDeviceModel } from '../lib/yoto-device.js'

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
    name: 'yoto-device-model',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto Device Model tester - Stateful device client with HTTP + MQTT

    Examples:
      ${name} abc123                           # Start device model (runs indefinitely)
      ${name} abc123 --duration 30             # Run for 30 seconds
      ${name} abc123 --poll-interval 300000    # Poll every 5 minutes
`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const deviceId = args.positionals[0]
const pollInterval = args.values['poll-interval'] ? Number(args.values['poll-interval']) : 600000
const duration = args.values['duration'] ? Number(args.values['duration']) : null

if (!deviceId) {
  console.error('❌ deviceId is required as first positional argument')
  console.error('Usage: yoto-device-model <deviceId> [options]')
  console.error('Example: yoto-device-model abc123 --duration 30')
  process.exit(1)
}

async function main () {
  printHeader('Yoto Device Model Tester')

  try {
    // Create API client
    console.log('\n📡 Creating YotoClient...')
    const client = createYotoClient({
      clientId,
      refreshToken,
      accessToken,
      outputFile: envFile
    })

    // Get device info
    console.log(`\n🔍 Fetching device info for: ${deviceId}`)
    const { devices } = await client.getDevices()
    const device = devices.find(d => d.deviceId === deviceId)

    if (!device) {
      console.error(`❌ Device with ID '${deviceId}' not found`)
      process.exit(1)
    }

    console.log(`✅ Found device: ${device.name} (${device.deviceType})`)

    // Create device model
    console.log('\n🎛️  Creating YotoDeviceModel...')
    const deviceModel = new YotoDeviceModel(client, device, {
      httpPollIntervalMs: pollInterval
    })

    console.log(`   HTTP polling interval: ${pollInterval}ms (${pollInterval / 1000}s)`)

    // Setup event handlers with timer-based display logic
    console.log('\n📡 Setting up event handlers...')

    // Timer state for each event type
    let lastStatusFullDisplay = 0
    let lastConfigFullDisplay = 0
    let lastPlaybackFullDisplay = 0
    const FULL_DISPLAY_INTERVAL_MS = 30000 // 30 seconds

    deviceModel.on('started', () => {
      console.log('✅ Device model started')
    })

    deviceModel.on('stopped', () => {
      console.log('🛑 Device model stopped')
    })

    deviceModel.on('statusUpdate', (status, source, changedFields) => {
      const timestamp = new Date().toISOString()
      const capabilities = deviceModel.capabilities
      const now = Date.now()
      const showFullState = (now - lastStatusFullDisplay) >= FULL_DISPLAY_INTERVAL_MS

      if (showFullState) {
        // Show full state
        console.log(`\n📊 STATUS UPDATE [${timestamp}] via ${source}: (FULL STATE)`)
        console.log(`   Battery: ${status.batteryLevelPercentage}%`)
        console.log(`   Charging: ${status.isCharging}`)
        console.log(`   Online: ${status.isOnline}`)
        console.log(`   Max Volume: ${status.maxVolume}/16`)
        console.log(`   Volume: ${status.volume}/16`)
        if (capabilities.hasTemperatureSensor) {
          console.log(`   Temperature: ${status.temperatureCelsius}°C`)
        }
        if (capabilities.hasAmbientLightSensor) {
          console.log(`   Ambient Light: ${status.ambientLightSensorReading}`)
        }
        console.log(`   WiFi: ${status.wifiStrength} dBm`)
        console.log(`   Active Card: ${status.activeCardId || 'none'}`)
        console.log(`   Power Source: ${status.powerSource}`)
        console.log(`   Day Mode: ${status.dayMode}`)
        console.log(`   Card Insertion: ${status.cardInsertionState}`)
        if (capabilities.hasColoredNightlight) {
          const nightlight = deviceModel.nightlight
          console.log(`   Nightlight: ${nightlight.name} (${nightlight.value})`)
        }
        console.log(`   Firmware: ${status.firmwareVersion}`)
        console.log(`   Uptime: ${status.uptime}s`)
        console.log(`   Updated At: ${status.updatedAt}`)
        lastStatusFullDisplay = now
      } else if (changedFields && changedFields.size > 0) {
        // Show only changed fields
        console.log(`\n📊 STATUS UPDATE [${timestamp}] via ${source}: (${changedFields.size} change${changedFields.size === 1 ? '' : 's'})`)
        for (const field of changedFields) {
          let value = status[field]
          if (field === 'volume') {
            value = `${value}/16 (max: ${status.maxVolume}/16)`
          } else if (field === 'maxVolume') {
            value = `${value}/16`
          } else if (field === 'temperatureCelsius') {
            value = `${value}°C`
          } else if (field === 'wifiStrength') {
            value = `${value} dBm`
          } else if (field === 'batteryLevelPercentage') {
            value = `${value}%`
          } else if (field === 'uptime') {
            value = `${value}s`
          } else if (field === 'nightlightMode' && typeof value === 'string') {
            const colorName = YotoDeviceModel.getNightlightColorName(value)
            value = `${colorName} (${value})`
          }
          console.log(`   ${field}: ${value}`)
        }
      } else {
        // No changes (shouldn't happen, but handle it)
        console.log(`\n📊 STATUS UPDATE [${timestamp}] via ${source}: (no changes)`)
      }
    })

    deviceModel.on('configUpdate', (config, changedFields) => {
      const timestamp = new Date().toISOString()
      const now = Date.now()
      const showFullState = (now - lastConfigFullDisplay) >= FULL_DISPLAY_INTERVAL_MS

      if (showFullState) {
        // Show full config state
        console.log(`\n⚙️  CONFIG UPDATE [${timestamp}]: (FULL STATE)`)
        console.log(`   Max Volume Limit: ${config.maxVolumeLimit}`)
        console.log(`   Day Time: ${config.dayTime}`)
        console.log(`   Night Time: ${config.nightTime}`)
        console.log(`   Timezone: ${config.timezone}`)
        console.log(`   Repeat All: ${config.repeatAll}`)
        console.log(`   Bluetooth Enabled: ${config.bluetoothEnabled}`)
        console.log(`   BT Headphones Enabled: ${config.btHeadphonesEnabled}`)
        console.log(`   Clock Face: ${config.clockFace}`)
        console.log(`   💡 Day Display Brightness: ${config.dayDisplayBrightness}`)
        console.log(`   💡 Night Display Brightness: ${config.nightDisplayBrightness}`)
        console.log(`   Shutdown Timeout: ${config.shutdownTimeout}`)
        console.log(`   Volume Level: ${config.volumeLevel}`)
        console.log(`   Ambient Colour: ${config.ambientColour}`)
        console.log(`   Night Ambient Colour: ${config.nightAmbientColour}`)
        lastConfigFullDisplay = now
      } else if (changedFields && changedFields.size > 0) {
        // Show only changed fields
        console.log(`\n⚙️  CONFIG UPDATE [${timestamp}]: (${changedFields.size} change${changedFields.size === 1 ? '' : 's'})`)
        for (const field of changedFields) {
          // Highlight brightness changes
          const prefix = (field === 'dayDisplayBrightness' || field === 'nightDisplayBrightness') ? '💡 ' : ''
          console.log(`   ${prefix}${field}: ${config[field]}`)
        }
      } else {
        console.log(`\n⚙️  CONFIG UPDATE [${timestamp}]: (no changes)`)
      }
    })

    deviceModel.on('playbackUpdate', (playback, changedFields) => {
      const timestamp = new Date().toISOString()
      const now = Date.now()
      const showFullState = (now - lastPlaybackFullDisplay) >= FULL_DISPLAY_INTERVAL_MS

      // Get playback icon based on state
      let playbackIcon = '⏏️' // Default: ejected/no card
      const hasCard = playback.cardId !== null
      if (hasCard || playback.playbackStatus === 'playing' || playback.playbackStatus === 'paused') {
        if (playback.playbackStatus === 'playing') {
          playbackIcon = '▶️'
        } else if (playback.playbackStatus === 'paused') {
          playbackIcon = '⏸️'
        } else {
          playbackIcon = '⏹️' // Stopped but card present
        }
      }

      if (showFullState) {
        // Show full playback state
        console.log(`\n${playbackIcon}  PLAYBACK UPDATE [${timestamp}]: (FULL STATE)`)
        console.log(`   Status: ${playback.playbackStatus}`)
        console.log(`   Track: ${playback.trackTitle}`)
        console.log(`   Track Key: ${playback.trackKey}`)
        console.log(`   Chapter: ${playback.chapterTitle}`)
        console.log(`   Chapter Key: ${playback.chapterKey}`)
        console.log(`   Position: ${playback.position}/${playback.trackLength}s`)
        console.log(`   Card ID: ${playback.cardId}`)
        console.log(`   Source: ${playback.source}`)
        console.log(`   Streaming: ${playback.streaming}`)
        console.log(`   Sleep Timer Active: ${playback.sleepTimerActive}`)
        console.log(`   Sleep Timer Seconds: ${playback.sleepTimerSeconds}`)
        console.log(`   Updated At: ${playback.updatedAt}`)
        lastPlaybackFullDisplay = now
      } else if (changedFields && changedFields.size > 0) {
        // Show only changed fields
        console.log(`\n${playbackIcon}  PLAYBACK UPDATE [${timestamp}]: (${changedFields.size} change${changedFields.size === 1 ? '' : 's'})`)
        for (const field of changedFields) {
          let value = playback[field]
          if (field === 'position' || field === 'trackLength') {
            // Show position/trackLength together if either changed
            value = `${playback.position}/${playback.trackLength}s`
            console.log(`   position/trackLength: ${value}`)
            // Skip if we already printed this combo
            if (field === 'trackLength') continue
          } else {
            console.log(`   ${field}: ${value}`)
          }
        }
      } else {
        console.log(`\n${playbackIcon}  PLAYBACK UPDATE [${timestamp}]: (no changes)`)
      }
    })

    deviceModel.on('online', (metadata) => {
      const timestamp = new Date().toISOString()
      console.log(`\n🟢 DEVICE ONLINE [${timestamp}]:`)
      console.log(`   Reason: ${metadata.reason}`)
      if (metadata.upTime !== undefined) {
        console.log(`   Uptime: ${metadata.upTime}s`)
      }
    })

    deviceModel.on('offline', (metadata) => {
      const timestamp = new Date().toISOString()
      console.log(`\n🔴 DEVICE OFFLINE [${timestamp}]:`)
      console.log(`   Reason: ${metadata.reason}`)
      if (metadata.shutDownReason) {
        console.log(`   Shutdown Reason: ${metadata.shutDownReason}`)
      }
      if (metadata.timeSinceLastSeen !== undefined) {
        console.log(`   Time Since Last Seen: ${metadata.timeSinceLastSeen}ms`)
      }
    })

    deviceModel.on('mqttConnect', () => {
      const timestamp = new Date().toISOString()
      console.log(`\n🔌 MQTT CONNECTED [${timestamp}]`)
    })

    deviceModel.on('mqttDisconnect', (metadata) => {
      const timestamp = new Date().toISOString()
      console.log(`\n🔌 MQTT DISCONNECTED [${timestamp}]`)
      const reasonCode = metadata.packet.reasonCode ?? 'unknown'
      console.log(`   Reason Code: ${reasonCode}`)
      console.log('   Packet:', metadata.packet)
    })

    deviceModel.on('mqttClose', (metadata) => {
      const timestamp = new Date().toISOString()
      console.log(`\n🔌 MQTT CLOSED [${timestamp}]`)
      console.log(`   Reason: ${metadata.reason}`)
    })

    deviceModel.on('mqttReconnect', () => {
      const timestamp = new Date().toISOString()
      console.log(`\n🔌 MQTT RECONNECTING [${timestamp}]`)
    })

    deviceModel.on('error', (error) => {
      const timestamp = new Date().toISOString()
      console.error(`\n⚠️  ERROR [${timestamp}]:`)
      console.error(`   ${error.message}`)
    })

    // Handle graceful shutdown
    const cleanup = async () => {
      console.log('\n\n🛑 Shutting down...')
      try {
        await deviceModel.stop()
        console.log('✅ Device model stopped cleanly')
        process.exit(0)
      } catch (err) {
        console.error('❌ Error during shutdown:', err)
        process.exit(1)
      }
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    // Start device model
    console.log('\n🚀 Starting device model...')
    await deviceModel.start()

    console.log('\n✅ Device model is running!')
    console.log('\n📊 Current State:')
    console.log(`   Device: ${deviceModel.device.name}`)
    console.log(`   Type: ${deviceModel.device.deviceType}`)
    console.log(`   Online: ${deviceModel.deviceOnline}`)
    console.log(`   MQTT Connected: ${deviceModel.mqttConnected}`)
    console.log(`   Initialized: ${deviceModel.initialized}`)
    console.log(`   Running: ${deviceModel.running}`)

    console.log('\n💡 Current Brightness Config:')
    console.log(`   Day Display Brightness: ${deviceModel.config.dayDisplayBrightness}`)
    console.log(`   Night Display Brightness: ${deviceModel.config.nightDisplayBrightness}`)

    console.log('\n🔧 Capabilities:')
    console.log(`   Temperature Sensor: ${deviceModel.capabilities.hasTemperatureSensor}`)
    console.log(`   Ambient Light Sensor: ${deviceModel.capabilities.hasAmbientLightSensor}`)
    console.log(`   Colored Nightlight: ${deviceModel.capabilities.hasColoredNightlight}`)
    console.log(`   Supported: ${deviceModel.capabilities.supported}`)

    console.log('\n👂 Listening for events... (Ctrl+C to stop)')

    if (duration) {
      console.log(`⏱️  Will auto-stop after ${duration} seconds\n`)
      setTimeout(async () => {
        console.log(`\n⏰ ${duration} seconds elapsed, stopping...`)
        await cleanup()
      }, duration * 1000)
    } else {
      console.log('   (Running indefinitely)\n')
    }

    // Keep process alive (unless duration is set)
    if (!duration) {
      await new Promise(() => {}) // Keep alive indefinitely
    }
  } catch (error) {
    handleCliError(error)
  }
}

// Run the main function
await main().catch(handleCliError)
