/** @import { YotoDeviceModel } from './yoto-device.js' */

import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'node:path'
import { YotoAccount } from './yoto-account.js'
import { loadTestTokens } from './api-endpoints/endpoint-test-helpers.js'
import { saveTokensToEnv } from '../bin/lib/token-helpers.js'
import {
  assertConfigShape,
  assertPlaybackShape,
  toLower,
  withTimeout
} from './test-helpers/device-model-test-helpers.js'

const envPath = join(import.meta.dirname, '..', '.env')

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
  /** @type {{ deviceId: string }[]} */
  const deviceAddedEvents = []
  /** @type {YotoDeviceModel | undefined} */
  let onlineMini
  /** @type {YotoDeviceModel | undefined} */
  let onlineV3

  t.before(async () => {
    loadTestTokens()
    account = createTestAccount()
    account.on('deviceAdded', (event) => {
      deviceAddedEvents.push(event)
    })
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
    assert.equal(deviceAddedEvents.length, account.devices.size, 'deviceAdded events should match device count')
    for (const event of deviceAddedEvents) {
      assert.equal(typeof event.deviceId, 'string', 'deviceAdded should include a deviceId')
      assert.ok(!('deviceModel' in event), 'deviceAdded should not include deviceModel')
      assert.equal(Object.keys(event).length, 1, 'deviceAdded should only include deviceId')
    }
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
