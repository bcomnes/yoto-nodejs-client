#!/usr/bin/env node

/**
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

import { printHelpText } from 'argsclopts'
import { parseArgs } from 'node:util'
import * as readline from 'node:readline'
import { pkg } from '../lib/pkg.cjs'
import {
  getCommonOptions,
  loadTokensFromEnv,
  createYotoClient,
  handleCliError,
  printHeader
} from './lib/cli-helpers.js'
import { createYotoMqttClient } from '../lib/mqtt/index.js'
import { parseTemperature } from '../lib/helpers/temperature.js'

/** @type {ArgscloptsParseArgsOptionsConfig} */
const options = {
  ...getCommonOptions(),
  'device-id': {
    type: 'string',
    short: 'd',
    help: 'Specific device ID to fetch'
  },
  status: {
    type: 'boolean',
    short: 's',
    help: 'Get only device status - battery, charging, online state (requires --device-id)'
  },
  mqtt: {
    type: 'boolean',
    short: 'm',
    help: 'Connect to MQTT and listen for device messages (requires --device-id)'
  },
  'mqtt-timeout': {
    type: 'string',
    help: 'Auto-disconnect MQTT after N seconds (requires --mqtt)'
  },
  'mqtt-request-status': {
    type: 'string',
    help: 'Request device status after N milliseconds of connecting (requires --mqtt, default: 1000)'
  },
  'mqtt-request-events': {
    type: 'string',
    help: 'Request device events after N milliseconds of connecting (requires --mqtt, default: 3000)'
  }
}

const args = parseArgs({ options, strict: false })

if (args.values['help']) {
  await printHelpText({
    options,
    name: 'yoto-devices',
    version: pkg.version,
    exampleFn: ({ name }) => `    Yoto devices information helper\n\n    Examples:\n      ${name}                              # List all devices (GET /device-v2/devices/mine)\n      ${name} --device-id abc123           # Get device details + config + shortcuts\n      ${name} --device-id abc123 --status  # Get only status (battery, charging, online)\n      ${name} --device-id abc123 --mqtt    # Listen to MQTT messages\n      ${name} --device-id abc123 --mqtt --mqtt-timeout 10  # Sample MQTT for 10s\n      ${name} --device-id abc123 --mqtt --mqtt-request-status 500  # Request status after 500ms\n      ${name} --device-id abc123 --mqtt --mqtt-request-events 2000  # Request events after 2s\n`
  })
  process.exit(0)
}

// Load tokens from environment
const { clientId, refreshToken, accessToken, envFile } = loadTokensFromEnv(args)

const deviceId = args.values['device-id'] ? String(args.values['device-id']) : null
const getStatus = Boolean(args.values['status'])
const useMqtt = Boolean(args.values['mqtt'])
const mqttStopAfter = args.values['mqtt-timeout'] ? Number(args.values['mqtt-timeout']) : null
const mqttRequestStatus = useMqtt && args.values['mqtt-request-status'] !== undefined ? Number(args.values['mqtt-request-status']) : null
const mqttRequestEvents = useMqtt && args.values['mqtt-request-events'] !== undefined ? Number(args.values['mqtt-request-events']) : null

if (getStatus && !deviceId) {
  console.error('❌ --status flag requires --device-id')
  console.error('Usage: yoto-devices --device-id abc123 --status')
  process.exit(1)
}

if (useMqtt && !deviceId) {
  console.error('❌ --mqtt flag requires --device-id')
  console.error('Usage: yoto-devices --device-id abc123 --mqtt')
  process.exit(1)
}

if (mqttStopAfter && !useMqtt) {
  console.error('❌ --mqtt-timeout requires --mqtt')
  console.error('Usage: yoto-devices --device-id abc123 --mqtt --mqtt-timeout 10')
  process.exit(1)
}

async function main () {
  printHeader('Yoto Devices')

  try {
    // Create client
    const client = createYotoClient({
      clientId,
      refreshToken,
      accessToken,
      outputFile: envFile
    })

    if (deviceId) {
      if (getStatus) {
        // Get device status
        console.log(`\n📡 GET /device-v2/devices/${deviceId}/status`)
        console.log(`Fetching status for device: ${deviceId}\n`)
        const status = await client.getDeviceStatus({ deviceId })
        console.dir(status, { depth: null, colors: true })
      } else {
        // Get specific device from list
        console.log('\n📡 GET /device-v2/devices/mine')
        console.log(`Fetching device: ${deviceId}\n`)
        const devicesResponse = await client.getDevices()
        const device = devicesResponse.devices.find(d => d.deviceId === deviceId)

        if (device) {
          console.log('Device:')
          console.dir(device, { depth: null, colors: true })

          // Get device status
          console.log(`\n📡 GET /device-v2/devices/${deviceId}/status`)
          console.log('Device Status:')
          const status = await client.getDeviceStatus({ deviceId })
          console.dir(status, { depth: null, colors: true })

          // Get device config
          console.log(`\n📡 GET /device-v2/devices/${deviceId}/config`)
          console.log('Device Config:')
          const config = await client.getDeviceConfig({ deviceId })
          console.dir(config, { depth: null, colors: true })

          // Get device shortcuts
          console.log(`\n📡 GET /device-v2/devices/${deviceId}/config`)
          console.log('Device Shortcuts:')
          const shortcuts = await client.getDeviceConfig({ deviceId })
          if (shortcuts.device?.shortcuts) {
            console.dir(shortcuts.device.shortcuts, { depth: null, colors: true })
          } else {
            console.log('No shortcuts available')
          }
        } else {
          console.error(`❌ Device with ID '${deviceId}' not found`)
          process.exit(1)
        }
      }
    } else {
      // Get all devices
      console.log('\n📡 GET /device-v2/devices/mine')
      console.log('Fetching all devices...\n')
      const devicesResponse = await client.getDevices()
      console.dir(devicesResponse, { depth: null, colors: true })
    }

    // MQTT listening mode
    if (useMqtt && deviceId) {
      console.log('\n' + '='.repeat(60))
      console.log('🔌 Connecting to MQTT...')
      console.log('='.repeat(60))

      const mqttClient = createYotoMqttClient({
        deviceId,
        accessToken
      })

      // Setup message handlers
      mqttClient.on('connected', () => {
        console.log('✅ Connected to MQTT broker')
        console.log('📡 Subscribed to topics:')
        console.log(`   • device/${deviceId}/data/events (playback events)`)
        console.log(`   • device/${deviceId}/data/status (regular status)`)
        console.log(`   • device/${deviceId}/status (legacy status - lifecycle events)`)
        console.log(`   • device/${deviceId}/response (command responses)`)
        console.log('\n👂 Listening for messages... (Ctrl+C to stop)')
        console.log('\n⌨️  Interactive Controls:')
        console.log('   s = Request status')
        console.log('   e = Request events')
        console.log('   Enter = Insert dated separator line')
        console.log('   q = Quit\n')

        if (mqttStopAfter) {
          console.log(`⏱️  Will auto-disconnect after ${mqttStopAfter} seconds\n`)
        }

        // Request initial status if configured
        if (mqttRequestStatus !== null) {
          console.log(`⏱️  Will request status after ${mqttRequestStatus}ms`)
          setTimeout(() => {
            const requestId = `auto-status-${Date.now()}`
            mqttClient.requestStatus(requestId).catch(err => {
              console.error('⚠️  Failed to request status:', err.message)
            })
          }, mqttRequestStatus)
        }

        // Request initial events if configured
        if (mqttRequestEvents !== null) {
          console.log(`⏱️  Will request events after ${mqttRequestEvents}ms`)
          setTimeout(() => {
            const requestId = `auto-events-${Date.now()}`
            mqttClient.requestEvents(requestId).catch(err => {
              console.error('⚠️  Failed to request events:', err.message)
            })
          }, mqttRequestEvents)
        }

        if (mqttRequestStatus === null && mqttRequestEvents === null) {
          console.log('💡 Tip: Use --mqtt-request-status or --mqtt-request-events to request initial data')
        }

        console.log() // Add blank line for spacing

        // Setup interactive keyboard input
        readline.emitKeypressEvents(process.stdin)
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true)
        }

        process.stdin.on('keypress', (_str, key) => {
          if (key.ctrl && key.name === 'c') {
            cleanup()
            return
          }

          if (key.name === 's') {
            const requestId = `interactive-${Date.now()}`
            console.log(`\n⌨️  Requesting status [${requestId}]...`)
            mqttClient.requestStatus(requestId).catch(err => {
              console.error('⚠️  Failed to request status:', err.message)
            })
          } else if (key.name === 'e') {
            const requestId = `interactive-${Date.now()}`
            console.log(`\n⌨️  Requesting events [${requestId}]...`)
            mqttClient.requestEvents(requestId).catch(err => {
              console.error('⚠️  Failed to request events:', err.message)
            })
          } else if (key.name === 'return') {
            const timestamp = new Date().toISOString()
            console.log(`\n${'─'.repeat(60)}`)
            console.log(`📍 MARKER [${timestamp}]`)
            console.log(`${'─'.repeat(60)}\n`)
          } else if (key.name === 'q') {
            cleanup()
          }
        })
      })

      mqttClient.on('events', (topic, payload) => {
        const timestamp = new Date().toISOString()
        console.log(`\n📨 EVENTS MESSAGE [${timestamp}]:`)
        console.log(`Topic: ${topic}`)
        console.log('─'.repeat(60))
        console.dir(payload, { depth: null, colors: true })
      })

      mqttClient.on('status', (topic, payload) => {
        const timestamp = new Date().toISOString()
        console.log(`\n📊 STATUS MESSAGE [${timestamp}]:`)
        console.log(`Topic: ${topic}`)
        console.log('─'.repeat(60))
        console.dir(payload, { depth: null, colors: true })
      })

      mqttClient.on('status-legacy', (topic, payload) => {
        const timestamp = new Date().toISOString()
        console.log(`\n🔧 STATUS-LEGACY MESSAGE [${timestamp}]:`)
        console.log(`Topic: ${topic}`)
        console.log('─'.repeat(60))

        // Highlight lifecycle fields
        if (payload.status?.shutDown) {
          const shutDown = payload.status.shutDown
          if (shutDown === 'nA') {
            console.log('🟢 Device Status: RUNNING (shutDown: "nA")')
          } else {
            console.log(`🔴 Device Status: SHUTDOWN (shutDown: "${shutDown}")`)
          }
        }
        if (payload.status?.upTime !== undefined) {
          console.log(`⏱️  Uptime: ${payload.status.upTime}s`)
        }
        if (payload.status?.wifiStrength !== undefined) {
          console.log(`📶 WiFi: ${payload.status.wifiStrength} dBm`)
        }
        if (payload.status?.battery !== undefined) {
          console.log(`🔋 Battery: ${payload.status.battery} mV`)
        }
        if (payload.status?.temp !== undefined) {
          const tempStr = String(payload.status.temp)
          const parsedTemp = parseTemperature(payload.status.temp)
          if (parsedTemp !== null) {
            console.log(`🌡️  Temperature: ${parsedTemp}°C (raw: "${tempStr}")`)
          } else {
            console.log(`🌡️  Temperature: ${tempStr} (unavailable)`)
          }
        }
        console.log('─'.repeat(60))
        console.dir(payload, { depth: null, colors: true })
      })

      mqttClient.on('response', (topic, payload) => {
        const timestamp = new Date().toISOString()
        console.log(`\n✉️  RESPONSE MESSAGE [${timestamp}]:`)
        console.log(`Topic: ${topic}`)
        console.log('─'.repeat(60))
        console.dir(payload, { depth: null, colors: true })
      })

      mqttClient.on('unknown', (topic, payload) => {
        const timestamp = new Date().toISOString()
        console.log(`\n❓ UNKNOWN MESSAGE [${timestamp}]:`)
        console.log(`Topic: ${topic}`)
        console.log('─'.repeat(60))
        console.dir(payload, { depth: null, colors: true })
      })

      mqttClient.on('disconnected', () => {
        console.log('\n❌ Disconnected from MQTT broker')
      })

      mqttClient.on('reconnecting', () => {
        console.log('\n🔄 Reconnecting to MQTT broker...')
      })

      mqttClient.on('error', (error) => {
        console.error('\n⚠️  MQTT Error:', error.message)
      })

      // Handle graceful shutdown
      const cleanup = async () => {
        console.log('\n\n🛑 Shutting down...')
        try {
          // Restore terminal
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false)
          }
          process.stdin.pause()

          await mqttClient.disconnect()
          console.log('✅ Disconnected cleanly')
          process.exit(0)
        } catch (err) {
          console.error('❌ Error during disconnect:', err)
          process.exit(1)
        }
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)

      // Connect to MQTT
      await mqttClient.connect()

      // Auto-disconnect timer if specified
      if (mqttStopAfter) {
        setTimeout(async () => {
          console.log(`\n⏰ ${mqttStopAfter} seconds elapsed, disconnecting...`)
          await cleanup()
        }, mqttStopAfter * 1000)
      }

      // Keep process alive (unless auto-disconnect is set)
      if (!mqttStopAfter) {
        await new Promise(() => {}) // Keep alive indefinitely
      }
    } else {
      process.exit(0)
    }
  } catch (error) {
    handleCliError(error)
  }
}

// Run the main function
await main().catch(handleCliError)
