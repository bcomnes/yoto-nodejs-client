/** @import { YotoDevice } from './api-endpoints/devices.js' */
/** @import { YotoPlaybackState } from './yoto-device.js' */

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
const PLAYBACK_SAMPLE_SCAN_LIMIT = 5

/**
 * @typedef {Object} PlaybackSample
 * @property {string} cardId
 * @property {string} cardTitle
 * @property {string | null} cardSlug
 * @property {string | null} cardCoverImageUrl
 * @property {string | null} cardAuthor
 * @property {string | null} cardReadBy
 * @property {number | null} cardDurationSeconds
 * @property {Map<string, { title: string, duration: number, chapterKey: string, chapterTitle: string }>} tracksByKey
 * @property {string} chapterKey
 * @property {string} chapterTitle
 * @property {string} trackKey
 * @property {string} trackTitle
 * @property {number} trackLength
 */

/**
 * @param {YotoDeviceModel} model
 * @param {(playback: YotoPlaybackState, changedFields: Set<keyof YotoPlaybackState>) => boolean} predicate
 * @param {number} timeoutMs
 * @param {string} label
 * @returns {Promise<[YotoPlaybackState, Set<keyof YotoPlaybackState>]>}
 */
function waitForPlaybackUpdateMatching (model, predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      model.off('playbackUpdate', handler)
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    /**
     * @param {YotoPlaybackState} playback
     * @param {Set<keyof YotoPlaybackState>} changedFields
     */
    const handler = (playback, changedFields) => {
      let matches = false

      try {
        matches = predicate(playback, changedFields)
      } catch (err) {
        clearTimeout(timeout)
        model.off('playbackUpdate', handler)
        reject(err)
        return
      }

      if (!matches) {
        return
      }

      clearTimeout(timeout)
      model.off('playbackUpdate', handler)
      resolve([playback, changedFields])
    }

    model.on('playbackUpdate', handler)
  })
}

/**
 * @param {YotoClient} client
 * @returns {Promise<PlaybackSample | null>}
 */
async function findPlaybackSample (client) {
  const response = await client.getUserMyoContent({ showDeleted: false })

  for (const card of response.cards.slice(0, PLAYBACK_SAMPLE_SCAN_LIMIT)) {
    if (!card.cardId || card.deleted) {
      continue
    }

    try {
      const contentResponse = await client.getContent({ cardId: card.cardId })
      const contentCard = contentResponse.card
      const metadata = contentCard.metadata
      const cardCoverImageUrl = metadata?.cover?.imageL ?? null
      const cardAuthor = metadata?.author ?? null
      const cardReadBy = metadata?.readBy ?? null
      const cardDurationSeconds = Number.isFinite(metadata?.media?.duration) ? metadata.media.duration : null
      const cardSlug = contentCard.slug || null
      const chapters = contentCard.content.chapters
      const firstChapter = chapters.find(candidate => candidate.tracks.length > 0)

      if (!firstChapter) {
        continue
      }

      const firstTrack = firstChapter.tracks[0]

      if (!firstTrack || typeof firstTrack.title !== 'string' || !Number.isFinite(firstTrack.duration)) {
        continue
      }

      const tracksByKey = new Map()

      for (const chapter of chapters) {
        for (const track of chapter.tracks) {
          if (!track || typeof track.title !== 'string' || !Number.isFinite(track.duration)) {
            continue
          }

          tracksByKey.set(track.key, {
            title: track.title,
            duration: track.duration,
            chapterKey: chapter.key,
            chapterTitle: chapter.title
          })
        }
      }

      return {
        cardId: contentCard.cardId,
        cardTitle: contentCard.title,
        cardSlug,
        cardCoverImageUrl,
        cardAuthor,
        cardReadBy,
        cardDurationSeconds,
        tracksByKey,
        chapterKey: firstChapter.key,
        chapterTitle: firstChapter.title,
        trackKey: firstTrack.key,
        trackTitle: firstTrack.title,
        trackLength: firstTrack.duration
      }
    } catch {
      continue
    }
  }

  return null
}

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

test('YotoDeviceModel - playback normalization', async (t) => {
  loadTestTokens()
  const client = createTestClient()
  const response = await client.getDevices()

  const onlineDevice = response.devices.find(device => device.online)
  if (!onlineDevice) {
    t.skip('No online device found')
    return
  }

  const sample = await findPlaybackSample(client)
  if (!sample) {
    t.skip('No MYO content with tracks available')
    return
  }

  const model = new YotoDeviceModel(client, onlineDevice)

  try {
    await waitForModelReady(model)
    assertPlaybackShape(model.playback)

    const mqttClient = model.mqttClient
    assert.ok(mqttClient, 'MQTT client should be initialized')

    await t.test('card cache enrichment', async () => {
      if (model.playback.cardId === sample.cardId) {
        const resetPromise = waitForPlaybackUpdateMatching(
          model,
          (playback, changedFields) => playback.cardId === null && changedFields.has('cardId'),
          5000,
          'playback card reset'
        )

        mqttClient.emit('events', 'test', { cardId: 'none' })
        await resetPromise
      }

      const cardUpdatePromise = waitForPlaybackUpdateMatching(
        model,
        (playback, changedFields) => playback.cardId === sample.cardId && changedFields.has('cardId'),
        5000,
        'playback card update'
      )

      const cacheUpdatePromise = waitForPlaybackUpdateMatching(
        model,
        (playback, changedFields) => {
          if (playback.cardId !== sample.cardId) {
            return false
          }

          return (
            changedFields.has('trackTitle') ||
            changedFields.has('trackLength') ||
            changedFields.has('chapterKey') ||
            changedFields.has('chapterTitle')
          )
        },
        15000,
        'playback cache update'
      )

      mqttClient.emit('events', 'test', {
        cardId: sample.cardId,
        trackKey: sample.trackKey
      })

      const [cardPlayback] = await cardUpdatePromise
      assert.equal(cardPlayback.cardId, sample.cardId)

      const [cachePlayback] = await cacheUpdatePromise
      assert.ok(cachePlayback.trackKey, 'trackKey should be set after cache update')
      const trackInfo = sample.tracksByKey.get(cachePlayback.trackKey)
      assert.ok(trackInfo, 'trackKey should exist in card content')
      assert.equal(cachePlayback.trackTitle, trackInfo.title)
      assert.equal(cachePlayback.trackLength, trackInfo.duration)
      assert.equal(cachePlayback.chapterKey, trackInfo.chapterKey)
      assert.equal(cachePlayback.chapterTitle, trackInfo.chapterTitle)
      assert.equal(cachePlayback.cardTitle, sample.cardTitle)
      assert.equal(cachePlayback.cardSlug, sample.cardSlug)
      assert.equal(cachePlayback.cardCoverImageUrl, sample.cardCoverImageUrl)
      assert.equal(cachePlayback.cardAuthor, sample.cardAuthor)
      assert.equal(cachePlayback.cardReadBy, sample.cardReadBy)
      assert.equal(cachePlayback.cardDurationSeconds, sample.cardDurationSeconds)
    })

    await t.test('cardId none normalization', async () => {
      const noneUpdatePromise = waitForPlaybackUpdateMatching(
        model,
        (playback, changedFields) => playback.cardId === null && changedFields.has('cardId'),
        5000,
        'playback cardId none normalization'
      )

      mqttClient.emit('events', 'test', { cardId: 'none' })

      const [nonePlayback, changedFields] = await noneUpdatePromise
      assert.equal(nonePlayback.cardId, null)
      assert.ok(changedFields.has('cardId'), 'cardId should be in changed fields')
    })
  } finally {
    await model.stop()
  }
})
