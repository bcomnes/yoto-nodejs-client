/** @import { YotoDeviceModel, YotoDeviceModelConfig, YotoPlaybackState } from '../yoto-device.js' */

import assert from 'node:assert/strict'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'

/**
 * @param {Promise<unknown>} promise
 * @param {number} timeoutMs
 * @param {string} label
 * @returns {Promise<unknown>}
 */
export function withTimeout (promise, timeoutMs, label) {
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
export async function waitForModelReady (model) {
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
export function assertConfigShape (config) {
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
export function assertPlaybackShape (playback) {
  assert.ok(playback, 'playback should exist')
  assert.equal(typeof playback.updatedAt, 'string', 'playback.updatedAt should be string')

  assert.ok(playback.cardId === null || typeof playback.cardId === 'string', 'playback.cardId should be string or null')
  assert.ok(playback.cardTitle === null || typeof playback.cardTitle === 'string', 'playback.cardTitle should be string or null')
  assert.ok(playback.cardSlug === null || typeof playback.cardSlug === 'string', 'playback.cardSlug should be string or null')
  assert.ok(playback.cardCoverImageUrl === null || typeof playback.cardCoverImageUrl === 'string', 'playback.cardCoverImageUrl should be string or null')
  assert.ok(playback.cardAuthor === null || typeof playback.cardAuthor === 'string', 'playback.cardAuthor should be string or null')
  assert.ok(playback.cardReadBy === null || typeof playback.cardReadBy === 'string', 'playback.cardReadBy should be string or null')
  assert.ok(playback.cardDurationSeconds === null || typeof playback.cardDurationSeconds === 'number', 'playback.cardDurationSeconds should be number or null')
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
 * @param {string | undefined} value
 * @returns {string}
 */
export function toLower (value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}
