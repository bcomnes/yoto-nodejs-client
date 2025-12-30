/** @import { YotoDeviceModelConfig, YotoPlaybackState } from './yoto-device.js' */
/** @import { YotoDevice } from './api-endpoints/devices.js' */

import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'node:path'
import { YotoClient } from './api-client.js'
import { YotoDeviceModel } from './yoto-device.js'
import { loadTestTokens } from './api-endpoints/endpoint-test-helpers.js'
import { saveTokensToEnv } from '../bin/lib/token-helpers.js'

const envPath = join(import.meta.dirname, '..', '.env')

/**
 * @returns {YotoClient}
 */
function createTestClient () {
  const clientId = process.env['YOTO_CLIENT_ID']
  const refreshToken = process.env['YOTO_REFRESH_TOKEN']
  const accessToken = process.env['YOTO_ACCESS_TOKEN']

  assert.ok(clientId, 'YOTO_CLIENT_ID is required')
  assert.ok(refreshToken, 'YOTO_REFRESH_TOKEN is required')
  assert.ok(accessToken, 'YOTO_ACCESS_TOKEN is required')

  return new YotoClient({
    clientId,
    refreshToken,
    accessToken,
    onTokenRefresh: async (tokens) => {
      const { resolvedPath } = await saveTokensToEnv(envPath, {
        access_token: tokens.updatedAccessToken,
        refresh_token: tokens.updatedRefreshToken,
        token_type: 'Bearer',
        expires_in: tokens.updatedExpiresAt - Math.floor(Date.now() / 1000)
      }, tokens.clientId)
      console.log(`Token Refreshed: ${resolvedPath}`)
    }
  })
}

/**
 * @param {Promise<unknown>} promise
 * @param {number} timeoutMs
 * @param {string} label
 * @returns {Promise<unknown>}
 */
function withTimeout (promise, timeoutMs, label) {
  return Promise.race([
    promise,
    sleep(timeoutMs).then(() => {
      throw new Error(`${label} timed out after ${timeoutMs}ms`)
    })
  ])
}

/**
 * @param {YotoDeviceModel} model
 * @returns {Promise<void>}
 */
async function waitForModelReady (model) {
  const started = withTimeout(once(model, 'started'), 15000, 'started')
  const statusUpdated = withTimeout(once(model, 'statusUpdate'), 15000, 'statusUpdate')
  const configUpdated = withTimeout(once(model, 'configUpdate'), 15000, 'configUpdate')

  await model.start()
  await Promise.all([started, statusUpdated, configUpdated])
  await sleep(1500)
}

/**
 * @param {YotoDeviceModelConfig} config
 */
function assertConfigShape (config) {
  assert.ok(Array.isArray(config.alarms), 'alarms should be an array')
  assert.equal(typeof config.ambientColour, 'string', 'ambientColour should be string')
  assert.equal(typeof config.bluetoothEnabled, 'boolean', 'bluetoothEnabled should be boolean')
  assert.equal(typeof config.btHeadphonesEnabled, 'boolean', 'btHeadphonesEnabled should be boolean')
  assert.equal(typeof config.clockFace, 'string', 'clockFace should be string')
  assert.equal(typeof config.dayDisplayBrightnessAuto, 'boolean', 'dayDisplayBrightnessAuto should be boolean')
  if (config.dayDisplayBrightnessAuto) {
    assert.equal(config.dayDisplayBrightness, null, 'dayDisplayBrightness should be null when auto')
  } else {
    assert.equal(typeof config.dayDisplayBrightness, 'number', 'dayDisplayBrightness should be number when not auto')
  }
  assert.equal(typeof config.dayTime, 'string', 'dayTime should be string')
  assert.equal(typeof config.dayYotoDaily, 'string', 'dayYotoDaily should be string')
  assert.equal(typeof config.dayYotoRadio, 'string', 'dayYotoRadio should be string')
  assert.equal(typeof config.daySoundsOff, 'boolean', 'daySoundsOff should be boolean')
  assert.equal(typeof config.displayDimBrightness, 'number', 'displayDimBrightness should be number')
  assert.equal(typeof config.displayDimTimeout, 'number', 'displayDimTimeout should be number')
  assert.equal(typeof config.headphonesVolumeLimited, 'boolean', 'headphonesVolumeLimited should be boolean')
  assert.ok(config.hourFormat === 12 || config.hourFormat === 24, 'hourFormat should be 12 or 24')
  assert.equal(typeof config.locale, 'string', 'locale should be string')
  assert.equal(typeof config.logLevel, 'string', 'logLevel should be string')
  assert.equal(typeof config.maxVolumeLimit, 'number', 'maxVolumeLimit should be number')
  assert.equal(typeof config.nightAmbientColour, 'string', 'nightAmbientColour should be string')
  assert.equal(typeof config.nightDisplayBrightnessAuto, 'boolean', 'nightDisplayBrightnessAuto should be boolean')
  if (config.nightDisplayBrightnessAuto) {
    assert.equal(config.nightDisplayBrightness, null, 'nightDisplayBrightness should be null when auto')
  } else {
    assert.equal(typeof config.nightDisplayBrightness, 'number', 'nightDisplayBrightness should be number when not auto')
  }
  assert.equal(typeof config.nightMaxVolumeLimit, 'number', 'nightMaxVolumeLimit should be number')
  assert.equal(typeof config.nightTime, 'string', 'nightTime should be string')
  assert.equal(typeof config.nightYotoDaily, 'string', 'nightYotoDaily should be string')
  assert.equal(typeof config.nightYotoRadioEnabled, 'boolean', 'nightYotoRadioEnabled should be boolean')
  if (config.nightYotoRadioEnabled) {
    assert.equal(typeof config.nightYotoRadio, 'string', 'nightYotoRadio should be string when enabled')
  } else {
    assert.equal(config.nightYotoRadio, null, 'nightYotoRadio should be null when disabled')
  }
  assert.equal(typeof config.nightSoundsOff, 'boolean', 'nightSoundsOff should be boolean')
  assert.equal(typeof config.pausePowerButton, 'boolean', 'pausePowerButton should be boolean')
  assert.equal(typeof config.pauseVolumeDown, 'boolean', 'pauseVolumeDown should be boolean')
  assert.equal(typeof config.repeatAll, 'boolean', 'repeatAll should be boolean')
  assert.equal(typeof config.showDiagnostics, 'boolean', 'showDiagnostics should be boolean')
  assert.equal(typeof config.shutdownTimeout, 'number', 'shutdownTimeout should be number')
  assert.equal(typeof config.systemVolume, 'number', 'systemVolume should be number')
  assert.equal(typeof config.timezone, 'string', 'timezone should be string')
  assert.equal(typeof config.volumeLevel, 'string', 'volumeLevel should be string')
}

/**
 * @param {YotoPlaybackState} playback
 */
function assertPlaybackShape (playback) {
  assert.ok(playback, 'playback should exist')
  assert.equal(typeof playback.updatedAt, 'string', 'playback.updatedAt should be string')

  assert.ok(playback.cardId === null || typeof playback.cardId === 'string', 'playback.cardId should be string or null')
  assert.ok(playback.source === null || typeof playback.source === 'string', 'playback.source should be string or null')
  assert.ok(playback.playbackStatus === null || typeof playback.playbackStatus === 'string', 'playback.playbackStatus should be string or null')
  assert.ok(playback.trackTitle === null || typeof playback.trackTitle === 'string', 'playback.trackTitle should be string or null')
  assert.ok(playback.trackKey === null || typeof playback.trackKey === 'string', 'playback.trackKey should be string or null')
  assert.ok(playback.chapterTitle === null || typeof playback.chapterTitle === 'string', 'playback.chapterTitle should be string or null')
  assert.ok(playback.chapterKey === null || typeof playback.chapterKey === 'string', 'playback.chapterKey should be string or null')
  assert.ok(playback.position === null || typeof playback.position === 'number', 'playback.position should be number or null')
  assert.ok(playback.trackLength === null || typeof playback.trackLength === 'number', 'playback.trackLength should be number or null')
  assert.ok(playback.streaming === null || typeof playback.streaming === 'boolean', 'playback.streaming should be boolean or null')
  assert.ok(playback.sleepTimerActive === null || typeof playback.sleepTimerActive === 'boolean', 'playback.sleepTimerActive should be boolean or null')
  assert.ok(playback.sleepTimerSeconds === null || typeof playback.sleepTimerSeconds === 'number', 'playback.sleepTimerSeconds should be number or null')
}

/**
 * @param {YotoClient} client
 * @param {YotoDevice} device
 * @returns {Promise<void>}
 */
async function assertDeviceModel (client, device) {
  const model = new YotoDeviceModel(client, device)

  try {
    await waitForModelReady(model)

    assertConfigShape(model.config)
    assertPlaybackShape(model.playback)

    // TODO: Add mutation coverage (updateConfig, startCard, pauseCard, etc.)
  } finally {
    await model.stop()
  }
}

test('YotoDeviceModel - online devices', async (t) => {
  loadTestTokens()
  const client = createTestClient()
  const response = await client.getDevices()

  /**
   * @param {string | undefined} value
   * @returns {string}
   */
  const toLower = (value) => typeof value === 'string' ? value.toLowerCase() : ''
  const onlineMini = response.devices.find(device =>
    device.online && (toLower(device.deviceFamily) === 'mini' || toLower(device.deviceType).includes('mini'))
  )
  const onlineV3 = response.devices.find(device =>
    device.online && (toLower(device.deviceFamily) === 'v3' || toLower(device.deviceType).includes('v3'))
  )

  await t.test('online mini', { skip: !onlineMini }, async () => {
    assert.ok(onlineMini, 'No online mini device found')
    await assertDeviceModel(client, onlineMini)
  })

  await t.test('online v3', { skip: !onlineV3 }, async () => {
    assert.ok(onlineV3, 'No online v3 device found')
    await assertDeviceModel(client, onlineV3)
  })
})
