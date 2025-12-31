/** @import { YotoDevice } from './api-endpoints/devices.js' */

import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { YotoClient } from './api-client.js'
import { YotoDeviceModel } from './yoto-device.js'
import { loadTestTokens } from './api-endpoints/endpoint-test-helpers.js'
import { saveTokensToEnv } from '../bin/lib/token-helpers.js'
import {
  assertConfigShape,
  assertPlaybackShape,
  toLower,
  waitForModelReady
} from './test-helpers/device-model-test-helpers.js'

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
