import test from 'node:test'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { getDevices } from '../api-endpoints/devices.js'
import { loadTestTokens, logResponse } from '../api-endpoints/endpoint-test-helpers.js'
import { RefreshableToken } from '../token.js'
import { createYotoMqttClient } from './index.js'

const { accessToken, refreshToken, clientId: oauthClientId } = loadTestTokens()

test('MQTT client', async (t) => {
  await t.test('should connect, request status/events, and receive response and events messages (status-legacy is optional)', async () => {
    // Get an online device
    const response = await getDevices({ accessToken })
    assert.ok(response.devices.length > 0, 'Should have at least one device')

    const onlineDevice = response.devices.find(d => d.online)
    assert.ok(onlineDevice, 'Should have at least one online device for MQTT testing')

    const deviceId = onlineDevice.deviceId

    const token = new RefreshableToken({
      clientId: oauthClientId,
      refreshToken,
      accessToken
    })

    // Create MQTT client
    const mqttClient = createYotoMqttClient({
      deviceId,
      token,
      clientId: randomUUID()
    })

    // Track received messages
    let statusResponseReceived = false
    let eventsResponseReceived = false
    let eventsMessageReceived = false
    let statusMessageReceived = false
    let statusLegacyMessageReceived = false
    /** @type {Error[]} */
    const errors = []

    // Setup message handlers
    mqttClient.on('events', (topic, payload) => {
      logResponse('MQTT events message', { topic, payload })

      try {
        // Validate events message structure
        assert.ok(payload, 'Events message should exist')
        assert.ok(typeof topic === 'string', 'Topic should be a string')
        assert.ok(topic.includes('/data/events'), 'Topic should contain /data/events')

        // Events messages are partial - not all fields are always present
        if (payload.playbackStatus !== undefined) {
          assert.ok(typeof payload.playbackStatus === 'string', 'playbackStatus should be string')
        }
        if (payload.cardId !== undefined) {
          assert.ok(typeof payload.cardId === 'string', 'cardId should be string')
        }

        eventsMessageReceived = true
      } catch (err) {
        errors.push(/** @type {Error} */ (err))
      }
    })

    mqttClient.on('status', (topic, payload) => {
      logResponse('MQTT status message', { topic, payload })

      try {
        // Validate status message structure
        assert.ok(payload, 'Status message should exist')
        assert.ok(typeof topic === 'string', 'Topic should be a string')
        assert.ok(topic.includes('/data/status'), 'Topic should contain /data/status')
        assert.ok(payload.status, 'Status message should have status object')
        assert.ok(typeof payload.status.statusVersion === 'number', 'Should have statusVersion number')
        assert.ok(typeof payload.status.fwVersion === 'string', 'Should have fwVersion string')
        assert.ok(typeof payload.status.productType === 'string', 'Should have productType string')
        assert.ok(typeof payload.status.batteryLevel === 'number', 'Should have batteryLevel number')
        assert.ok(typeof payload.status.volume === 'number', 'Should have volume number')

        statusMessageReceived = true
      } catch (err) {
        errors.push(/** @type {Error} */ (err))
      }
    })

    mqttClient.on('status-legacy', (topic, payload) => {
      logResponse('MQTT status-legacy message', { topic, payload })

      try {
        // Validate legacy status message structure
        assert.ok(payload, 'Legacy status message should exist')
        assert.ok(typeof topic === 'string', 'Topic should be a string')
        assert.ok(!topic.includes('/data/'), 'Legacy topic should NOT contain /data/')
        assert.ok(payload.status, 'Legacy status message should have status object')

        // Validate lifecycle fields unique to legacy format
        assert.ok(typeof payload.status.statusVersion === 'number', 'Should have statusVersion number')
        assert.ok(typeof payload.status.fwVersion === 'string', 'Should have fwVersion string')

        // shutDown field is the key field for lifecycle events
        if (payload.status.shutDown !== undefined) {
          assert.ok(typeof payload.status.shutDown === 'string', 'shutDown should be string')
        }

        // upTime and utcTime are key for startup detection
        if (payload.status.upTime !== undefined) {
          assert.ok(typeof payload.status.upTime === 'number', 'upTime should be number')
        }
        if (payload.status.utcTime !== undefined) {
          assert.ok(typeof payload.status.utcTime === 'number', 'utcTime should be number')
        }

        // Hardware diagnostic fields unique to legacy
        if (payload.status.battery !== undefined) {
          assert.ok(typeof payload.status.battery === 'number', 'battery should be number')
        }
        if (payload.status.wifiStrength !== undefined) {
          assert.ok(typeof payload.status.wifiStrength === 'number', 'wifiStrength should be number')
        }

        statusLegacyMessageReceived = true
      } catch (err) {
        errors.push(/** @type {Error} */ (err))
      }
    })

    mqttClient.on('response', (topic, payload) => {
      logResponse('MQTT response message', { topic, payload })

      try {
        // Validate response message structure
        assert.ok(payload, 'Response message should exist')
        assert.ok(typeof topic === 'string', 'Topic should be a string')
        assert.ok(topic.includes('/response'), 'Topic should contain /response')
        assert.ok(payload.status, 'Response should have status object')
        assert.ok(typeof payload.status.req_body === 'string', 'Response should have req_body string')

        // Check if status request was acknowledged (field name is 'status/request')
        if (payload.status['status/request']) {
          assert.ok(
            payload.status['status/request'] === 'OK' || payload.status['status/request'] === 'FAIL',
            'Status request field should be OK or FAIL'
          )
          statusResponseReceived = true
        }

        // Check if events request was acknowledged
        if (payload.status.events) {
          assert.ok(
            payload.status.events === 'OK' || payload.status.events === 'FAIL',
            'Events request field should be OK or FAIL'
          )
          eventsResponseReceived = true
        }
      } catch (err) {
        errors.push(/** @type {Error} */ (err))
      }
    })

    mqttClient.on('error', (error) => {
      console.error('MQTT error:', error)
      errors.push(error)
    })

    /** @type {NodeJS.Timeout | undefined} */
    let timeoutId
    /** @type {NodeJS.Timeout | undefined} */
    let checkIntervalId

    try {
      // Connect to MQTT
      await mqttClient.connect()
      assert.ok(mqttClient.connected, 'MQTT client should be connected')

      // Request status and events
      await mqttClient.requestStatus()
      await mqttClient.requestEvents()

      // Wait for messages (with timeout)
      await new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for messages. statusResponse=${statusResponseReceived}, eventsResponse=${eventsResponseReceived}, eventsMessage=${eventsMessageReceived}, statusMessage=${statusMessageReceived}, statusLegacy=${statusLegacyMessageReceived} (optional)`))
        }, 5000) // 5 second timeout

        checkIntervalId = setInterval(() => {
          if (errors.length > 0) {
            clearTimeout(timeoutId)
            clearInterval(checkIntervalId)
            reject(errors[0])
          }
          // Note: status-legacy is NOT required - it doesn't respond to requestStatus()
          // It only emits on real-time lifecycle events (shutdown/startup) or 5-minute periodic updates
          if (statusResponseReceived && eventsResponseReceived && eventsMessageReceived && statusMessageReceived) {
            clearTimeout(timeoutId)
            clearInterval(checkIntervalId)
            resolve(undefined)
          }
        }, 100)
      })

      // Verify we received all expected messages
      assert.ok(statusResponseReceived, 'Should have received status request response')
      assert.ok(eventsResponseReceived, 'Should have received events request response')
      assert.ok(eventsMessageReceived, 'Should have received events data message')
      assert.ok(statusMessageReceived, 'Should have received status data message')

      // Note: status-legacy message is optional in this test because it does NOT respond to requestStatus()
      // It only emits on real-time lifecycle events (shutdown/startup) or 5-minute periodic updates
      // If we happened to catch one during the test window, validate it was received correctly
      if (statusLegacyMessageReceived) {
        console.log('✓ Received optional status-legacy message with lifecycle events')
      }
    } catch (err) {
      // Clean up timers on error
      if (timeoutId) clearTimeout(timeoutId)
      if (checkIntervalId) clearInterval(checkIntervalId)
      throw err
    } finally {
      // Always disconnect, even if test fails
      if (timeoutId) clearTimeout(timeoutId)
      if (checkIntervalId) clearInterval(checkIntervalId)
      await mqttClient.disconnect()
      assert.ok(!mqttClient.connected, 'MQTT client should be disconnected')
    }

    // Re-throw any errors that occurred in event handlers
    if (errors.length > 0) {
      throw errors[0]
    }
  })
})
