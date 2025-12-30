import test from 'node:test'
import assert from 'node:assert'
import { getDevices, getDeviceStatus, getDeviceConfig } from './devices.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens, logResponse } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('getDevices', async (t) => {
  await t.test('should fetch user devices', async () => {
    const response = await getDevices({
      accessToken: await token.getAccessToken()
    })

    // Log response for type verification and documentation
    logResponse('GET /device-v2/devices/mine', response)

    // Validate response structure matches YotoDevicesResponse
    assert.ok(response, 'Response should exist')
    assert.ok(Array.isArray(response.devices), 'Response should have devices array')
    assert.ok(response.devices.length > 0, 'User should have at least one device')

    // Validate device structure
    const device = response.devices[0]
    assert.ok(device, 'Device should exist')
    assert.ok(typeof device.deviceId === 'string', 'Device should have deviceId string')
    assert.ok(typeof device.name === 'string', 'Device should have name string')
    assert.ok(typeof device.description === 'string', 'Device should have description string')
    assert.ok(typeof device.online === 'boolean', 'Device should have online boolean')
    assert.ok(typeof device.releaseChannel === 'string', 'Device should have releaseChannel string')
    assert.ok(typeof device.deviceType === 'string', 'Device should have deviceType string')
    assert.ok(typeof device.deviceFamily === 'string', 'Device should have deviceFamily string')
    assert.ok(typeof device.deviceGroup === 'string', 'Device should have deviceGroup string')
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getDevices({
          accessToken: 'invalid-token'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 401 || err.statusCode === 403, 'Should return 401 or 403 for invalid token')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })
})

test('getDeviceStatus', async (t) => {
  /** @type {string[]} */
  let testDeviceIds = []
  /** @type {string | undefined} */
  let onlineDeviceId
  /** @type {string | undefined} */
  let offlineDeviceId

  // Get real device IDs to test with
  await t.test('setup - get device IDs', async () => {
    const response = await getDevices({
      accessToken: await token.getAccessToken()
    })

    assert.ok(response.devices.length > 0, 'User should have at least one device for getDeviceStatus tests')

    // Try to find one online and one offline device
    onlineDeviceId = response.devices.find(d => d.online)?.deviceId
    offlineDeviceId = response.devices.find(d => !d.online)?.deviceId

    testDeviceIds = response.devices.slice(0, 2).map(device => device.deviceId).filter(Boolean)
    assert.ok(testDeviceIds.length > 0, 'Should have extracted at least one device ID')
  })

  await t.test('should fetch device status for valid device ID', async () => {
    const deviceId = testDeviceIds[0]
    assert.ok(deviceId, 'Device ID should exist')

    const status = await getDeviceStatus({
      accessToken: await token.getAccessToken(),
      deviceId
    })

    // Log response for type verification and documentation
    logResponse('GET /device-v2/{deviceId}/status', status)

    // Validate response structure matches YotoDeviceStatusResponse
    assert.ok(status, 'Response should exist')
    assert.strictEqual(status.deviceId, deviceId, 'Returned device ID should match requested ID')
    assert.ok(typeof status.updatedAt === 'string', 'Status should have updatedAt string')

    // Optional fields - only validate type if present
    if (status.batteryLevelPercentage !== undefined) {
      assert.ok(typeof status.batteryLevelPercentage === 'number', 'Battery level should be number')
    }
    if (status.isCharging !== undefined) {
      assert.ok(typeof status.isCharging === 'boolean', 'isCharging should be boolean')
    }
    if (status.isOnline !== undefined) {
      assert.ok(typeof status.isOnline === 'boolean', 'isOnline should be boolean')
    }
    if (status.userVolumePercentage !== undefined) {
      assert.ok(typeof status.userVolumePercentage === 'number', 'User volume should be number')
    }
    if (status.systemVolumePercentage !== undefined) {
      assert.ok(typeof status.systemVolumePercentage === 'number', 'System volume should be number')
    }
    if (status.temperatureCelcius !== undefined && status.temperatureCelcius !== null) {
      assert.ok(
        typeof status.temperatureCelcius === 'number' || typeof status.temperatureCelcius === 'string',
        'Temperature should be number or string'
      )
    }
    if (status.wifiStrength !== undefined) {
      assert.ok(typeof status.wifiStrength === 'number', 'WiFi strength should be number')
    }
    if (status.cardInsertionState !== undefined) {
      assert.ok([0, 1, 2].includes(status.cardInsertionState), 'Card insertion state should be 0, 1, or 2')
    }
    if (status.dayMode !== undefined) {
      assert.ok([-1, 0, 1].includes(status.dayMode), 'Day mode should be -1, 0, or 1')
    }
    if (status.powerSource !== undefined) {
      assert.ok([0, 1, 2, 3].includes(status.powerSource), 'Power source should be 0, 1, 2, or 3')
    }
  })

  await t.test('should work with multiple device IDs', async () => {
    // Test with multiple devices to ensure consistency
    for (const deviceId of testDeviceIds) {
      const status = await getDeviceStatus({
        accessToken: await token.getAccessToken(),
        deviceId
      })

      assert.ok(status, 'Response should exist')
      assert.strictEqual(status.deviceId, deviceId, 'Returned device ID should match requested ID')
    }
  })

  await t.test('should fetch status for online device if available', async () => {
    if (!onlineDeviceId) {
      return // Skip if no online devices
    }

    const status = await getDeviceStatus({
      accessToken: await token.getAccessToken(),
      deviceId: onlineDeviceId
    })

    // Log online device status
    logResponse('GET /device-v2/{deviceId}/status (ONLINE)', status)

    assert.ok(status, 'Response should exist')
    assert.strictEqual(status.deviceId, onlineDeviceId, 'Returned device ID should match')
  })

  await t.test('should fetch status for offline device if available', async () => {
    if (!offlineDeviceId) {
      return // Skip if no offline devices
    }

    const status = await getDeviceStatus({
      accessToken: await token.getAccessToken(),
      deviceId: offlineDeviceId
    })

    // Log offline device status
    logResponse('GET /device-v2/{deviceId}/status (OFFLINE)', status)

    assert.ok(status, 'Response should exist')
    assert.strictEqual(status.deviceId, offlineDeviceId, 'Returned device ID should match')
  })

  await t.test('should fail with invalid device ID', async () => {
    await assert.rejects(
      async () => {
        await getDeviceStatus({
          accessToken: await token.getAccessToken(),
          deviceId: 'invalid-device-id-12345'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 404, 'Should return 404 for invalid device ID')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })

  await t.test('should fail with invalid token', async () => {
    const deviceId = testDeviceIds[0]
    assert.ok(deviceId, 'Device ID should exist')

    await assert.rejects(
      async () => {
        await getDeviceStatus({
          accessToken: 'invalid-token',
          deviceId
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 401 || err.statusCode === 403, 'Should return 401 or 403 for invalid token')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })
})

test('getDeviceConfig', async (t) => {
  /** @type {string[]} */
  let testDeviceIds = []
  /** @type {Map<string, string>} */
  const deviceTypeMap = new Map()
  /** @type {string | undefined} */
  let onlineDeviceId
  /** @type {string | undefined} */
  let deviceWithAlarmsId

  // Get real device IDs to test with
  await t.test('setup - get device IDs', async () => {
    const response = await getDevices({
      accessToken: await token.getAccessToken()
    })

    assert.ok(response.devices.length > 0, 'User should have at least one device for getDeviceConfig tests')

    // Try to get different device types for testing
    for (const device of response.devices) {
      if (!deviceTypeMap.has(device.deviceType)) {
        deviceTypeMap.set(device.deviceType, device.deviceId)
      }
      // Also track an online device
      if (device.online && !onlineDeviceId) {
        onlineDeviceId = device.deviceId
      }
    }

    testDeviceIds = response.devices.slice(0, 2).map(device => device.deviceId).filter(Boolean)
    assert.ok(testDeviceIds.length > 0, 'Should have extracted at least one device ID')

    console.log(`\nTesting device types: ${Array.from(deviceTypeMap.keys()).join(', ')}`)
    console.log(`Online device for testing: ${onlineDeviceId || 'none'}`)

    // Try to find a device with alarms configured
    for (const deviceId of testDeviceIds) {
      try {
        const config = await getDeviceConfig({
          accessToken: await token.getAccessToken(),
          deviceId
        })
        if (config.device.config.alarms && config.device.config.alarms.length > 0) {
          deviceWithAlarmsId = deviceId
          console.log(`Device with alarms found: ${deviceId}`)
          break
        }
      } catch (err) {
        // Skip devices that error
      }
    }
    if (!deviceWithAlarmsId) {
      console.log('No devices with alarms found')
    }
  })

  await t.test('should fetch device config for valid device ID', async () => {
    const deviceId = testDeviceIds[0]
    assert.ok(deviceId, 'Device ID should exist')

    const config = await getDeviceConfig({
      accessToken: await token.getAccessToken(),
      deviceId
    })

    // Log response for type verification and documentation
    logResponse('GET /device-v2/{deviceId}/config', config)

    // Validate response structure matches YotoDeviceConfigResponse
    assert.ok(config, 'Response should exist')
    assert.ok(config.device, 'Response should have device property')
    assert.strictEqual(config.device.deviceId, deviceId, 'Returned device ID should match requested ID')

    // Validate device structure
    assert.ok(typeof config.device.deviceFamily === 'string', 'Device should have deviceFamily string')
    assert.ok(typeof config.device.deviceType === 'string', 'Device should have deviceType string')
    assert.ok(typeof config.device.online === 'boolean', 'Device should have online boolean')

    // Validate config object exists
    assert.ok(config.device.config, 'Device should have config object')
    assert.ok(typeof config.device.config === 'object', 'Config should be an object')

    // Validate some config fields
    if (config.device.config.ambientColour !== undefined) {
      assert.ok(typeof config.device.config.ambientColour === 'string', 'ambientColour should be string')
    }
    if (config.device.config.clockFace !== undefined) {
      assert.ok(typeof config.device.config.clockFace === 'string', 'clockFace should be string')
    }
    if (config.device.config.repeatAll !== undefined) {
      assert.ok(typeof config.device.config.repeatAll === 'boolean', 'repeatAll should be boolean')
    }
    if (config.device.config.volumeLevel !== undefined) {
      assert.ok(typeof config.device.config.volumeLevel === 'string', 'volumeLevel should be string')
    }

    // Validate shortcuts if present (beta feature)
    if (config.device.shortcuts) {
      assert.ok(typeof config.device.shortcuts === 'object', 'Shortcuts should be an object')
      if (config.device.shortcuts.versionId) {
        assert.ok(typeof config.device.shortcuts.versionId === 'string', 'versionId should be string')
      }
    }
  })

  await t.test('should work with multiple device IDs and types', async () => {
    // Test with different device types to ensure config properties vary appropriately
    for (const [deviceType, deviceId] of deviceTypeMap) {
      const config = await getDeviceConfig({
        accessToken: await token.getAccessToken(),
        deviceId
      })

      console.log(`\nDevice type: ${deviceType}, Device ID: ${deviceId}`)
      console.log(`  Config keys: ${Object.keys(config.device.config).join(', ')}`)

      assert.ok(config, 'Response should exist')
      assert.ok(config.device, 'Response should have device property')
      assert.strictEqual(config.device.deviceId, deviceId, 'Returned device ID should match requested ID')
      assert.strictEqual(config.device.deviceType, deviceType, 'Returned device type should match')

      // Config should always be present but properties may vary by device type
      assert.ok(config.device.config, 'Config should exist for all device types')
      assert.ok(typeof config.device.config === 'object', 'Config should be object')
    }
  })

  await t.test('should log config for each device type', async () => {
    // Log configurations for different device types to see variations
    for (const [deviceType, deviceId] of deviceTypeMap) {
      const config = await getDeviceConfig({
        accessToken: await token.getAccessToken(),
        deviceId
      })

      logResponse(`GET /device-v2/{deviceId}/config (${deviceType})`, config)
    }
  })

  await t.test('should fetch config for online device if available', async () => {
    if (!onlineDeviceId) {
      console.log('Skipping online device config test - no online devices found')
      return // Skip if no online devices
    }

    const config = await getDeviceConfig({
      accessToken: await token.getAccessToken(),
      deviceId: onlineDeviceId
    })

    // Log online device config
    logResponse('GET /device-v2/{deviceId}/config (ONLINE)', config)

    assert.ok(config, 'Response should exist')
    assert.ok(config.device, 'Response should have device property')
    assert.strictEqual(config.device.online, true, 'Device should be online')
    assert.strictEqual(config.device.deviceId, onlineDeviceId, 'Device ID should match')
  })

  await t.test('should fetch config with alarms if available', async () => {
    if (!deviceWithAlarmsId) {
      console.log('Skipping alarm test - no devices with alarms found')
      return // Skip if no devices with alarms
    }

    const config = await getDeviceConfig({
      accessToken: await token.getAccessToken(),
      deviceId: deviceWithAlarmsId
    })

    // Log device with alarms
    logResponse('GET /device-v2/{deviceId}/config (WITH ALARMS)', config)

    assert.ok(config, 'Response should exist')
    assert.ok(config.device, 'Response should have device property')
    assert.ok(config.device.config, 'Config should exist')
    assert.ok(Array.isArray(config.device.config.alarms), 'Alarms should be an array')
    assert.ok(config.device.config.alarms.length > 0, 'Should have at least one alarm')

    // Validate alarm structure
    const alarm = config.device.config.alarms[0]
    console.log(`\nAlarm structure: ${JSON.stringify(alarm, null, 2)}`)
  })

  // TODO: Add tests for updateDeviceConfig (mutation endpoint)
  // - should update device config successfully
  // - should return status 'ok' on successful update
  // - should update device name
  // - should update individual config properties (locale, bluetoothEnabled, etc.)
  // - should update day/night mode settings
  // - should update volume limits
  // - should update display brightness settings
  // - should update alarms array
  // - should validate response structure matches YotoUpdateDeviceConfigResponse
  // - should fail with invalid device ID
  // - should fail with invalid token
  // - should fail with invalid config values

  // TODO: Add tests for updateDeviceShortcuts (mutation endpoint - beta)
  // - should update shortcuts successfully
  // - should return status 'ok' on successful update
  // - should update day mode shortcuts
  // - should update night mode shortcuts
  // - should update shortcuts with track-play commands
  // - should set card/chapter/track parameters correctly
  // - should handle Yoto Daily dynamic tracks (<yyyymmdd>)
  // - should allow empty content arrays
  // - should validate response structure matches YotoUpdateShortcutsResponse
  // - should fail with invalid device ID
  // - should fail with invalid token
  // - should fail with invalid shortcuts structure

  // TODO: Add tests for sendDeviceCommand (MQTT mutation endpoint)
  // - should send volume/set command successfully
  // - should send ambients/set command with RGB values
  // - should send sleep-timer/set command
  // - should send card/start command with URI
  // - should send card/stop command
  // - should send card/pause command
  // - should send card/resume command
  // - should send bluetooth/on command
  // - should send bluetooth/off command
  // - should send reboot command
  // - should send status/request command
  // - should send events/request command
  // - should send display/preview command
  // - should return status 'ok' on successful command
  // - should validate response structure matches YotoDeviceCommandResponse
  // - should fail with invalid device ID
  // - should fail with invalid token
  // - should fail with invalid command payload

  await t.test('should fail with invalid device ID', async () => {
    await assert.rejects(
      async () => {
        await getDeviceConfig({
          accessToken: await token.getAccessToken(),
          deviceId: 'invalid-device-id-12345'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode >= 400, 'Should return error status code for invalid device ID')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })

  await t.test('should fail with invalid token', async () => {
    const deviceId = testDeviceIds[0]
    assert.ok(deviceId, 'Device ID should exist')

    await assert.rejects(
      async () => {
        await getDeviceConfig({
          accessToken: 'invalid-token',
          deviceId
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 401 || err.statusCode === 403, 'Should return 401 or 403 for invalid token')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })
})
