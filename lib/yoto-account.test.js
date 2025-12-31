/** @import { YotoDeviceModel, YotoDeviceModelConfig, YotoPlaybackState } from './yoto-device.js' */

import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'node:path'
import { YotoAccount } from './yoto-account.js'
import { loadTestTokens } from './api-endpoints/endpoint-test-helpers.js'
import { saveTokensToEnv } from '../bin/lib/token-helpers.js'

const envPath = join(import.meta.dirname, '..', '.env')

/**
 * @param {string | undefined} value
 * @returns {string}
 */
function toLower (value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

/**
 * @returns {YotoAccount}
 */
function createTestAccount () {
  const clientId = process.env['YOTO_CLIENT_ID']
  const refreshToken = process.env['YOTO_REFRESH_TOKEN']
  const accessToken = process.env['YOTO_ACCESS_TOKEN']

  assert.ok(clientId, 'YOTO_CLIENT_ID is required')
  assert.ok(refreshToken, 'YOTO_REFRESH_TOKEN is required')
  assert.ok(accessToken, 'YOTO_ACCESS_TOKEN is required')

  return new YotoAccount({
    clientOptions: {
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
    },
    deviceOptions: {
      httpPollIntervalMs: 600000
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
 * @param {YotoAccount} account
 * @returns {Promise<void>}
 */
async function waitForAccountReady (account) {
  const started = withTimeout(once(account, 'started'), 30000, 'started')
  await account.start()
  await started
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
 * @param {YotoDeviceModel} model
 */
function assertDeviceModelState (model) {
  assert.ok(model.running, 'device model should be running')
  assertConfigShape(model.config)
  assertPlaybackShape(model.playback)

  // TODO: Add mutation coverage (updateConfig, sendCommand, etc.)
}

test('YotoAccount - online devices', async (t) => {
  /** @type {YotoAccount | null} */
  let account = null
  /** @type {YotoDeviceModel[]} */
  let deviceModels = []
  /** @type {YotoDeviceModel | undefined} */
  let onlineMini
  /** @type {YotoDeviceModel | undefined} */
  let onlineV3

  t.before(async () => {
    loadTestTokens()
    account = createTestAccount()
    await waitForAccountReady(account)

    deviceModels = Array.from(account.devices.values())
    onlineMini = deviceModels.find(model => {
      const { deviceType, deviceFamily, online } = model.device
      const family = toLower(deviceFamily)
      const type = toLower(deviceType)
      return online && (family === 'mini' || type.includes('mini'))
    })
    onlineV3 = deviceModels.find(model => {
      const { deviceType, deviceFamily, online } = model.device
      const family = toLower(deviceFamily)
      const type = toLower(deviceType)
      return online && (family === 'v3' || type.includes('v3'))
    })
  })

  t.after(async () => {
    if (account) {
      await account.stop()
    }
  })

  await t.test('account state', async () => {
    assert.ok(account, 'account should exist')
    assert.ok(account.running, 'account should be running')
    assert.ok(account.initialized, 'account should be initialized')
    assert.ok(account.devices.size > 0, 'account should have devices')
    assert.equal(account.getDeviceIds().length, account.devices.size, 'device IDs should match map size')
  })

  await t.test('online mini', { skip: !onlineMini }, async () => {
    assert.ok(onlineMini, 'No online mini device found')
    assertDeviceModelState(onlineMini)
  })

  await t.test('online v3', { skip: !onlineV3 }, async () => {
    assert.ok(onlineV3, 'No online v3 device found')
    assertDeviceModelState(onlineV3)
  })
})
