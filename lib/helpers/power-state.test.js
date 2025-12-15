import test from 'node:test'
import assert from 'node:assert'
import { detectPowerState } from './power-state.js'

test('detectPowerState', async (t) => {
  await t.test('should detect normal running state', () => {
    const result = detectPowerState('nA', 3600)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.shutDownReason, null)
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should detect startup state with low uptime', () => {
    const result = detectPowerState('nA', 45)
    assert.strictEqual(result.state, 'startup')
    assert.strictEqual(result.shutDownReason, null)
    assert.strictEqual(result.upTime, 45)
  })

  await t.test('should detect startup at exactly 119 seconds', () => {
    const result = detectPowerState('nA', 119)
    assert.strictEqual(result.state, 'startup')
    assert.strictEqual(result.upTime, 119)
  })

  await t.test('should detect running at exactly 120 seconds (threshold)', () => {
    const result = detectPowerState('nA', 120)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should detect user shutdown', () => {
    const result = detectPowerState('userShutdown', 3600)
    assert.strictEqual(result.state, 'shutdown')
    assert.strictEqual(result.shutDownReason, 'userShutdown')
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should detect any non-nA value as shutdown', () => {
    const testCases = [
      'lowBattery',
      'timeout',
      'powerLoss',
      'unknown',
      'anyOtherValue'
    ]

    for (const shutDownValue of testCases) {
      const result = detectPowerState(shutDownValue, 1000)
      assert.strictEqual(result.state, 'shutdown')
      assert.strictEqual(result.shutDownReason, shutDownValue)
      assert.strictEqual(result.upTime, null)
    }
  })

  await t.test('should handle null shutDown as running', () => {
    const result = detectPowerState(null, 500)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.shutDownReason, null)
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should handle undefined shutDown as running', () => {
    const result = detectPowerState(undefined, 500)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.shutDownReason, null)
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should handle null upTime with nA', () => {
    const result = detectPowerState('nA', null)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should handle undefined upTime with nA', () => {
    const result = detectPowerState('nA', undefined)
    assert.strictEqual(result.state, 'running')
    assert.strictEqual(result.upTime, null)
  })

  await t.test('should detect startup with uptime 0', () => {
    const result = detectPowerState('nA', 0)
    assert.strictEqual(result.state, 'startup')
    assert.strictEqual(result.upTime, 0)
  })

  await t.test('should detect startup with uptime 1', () => {
    const result = detectPowerState('nA', 1)
    assert.strictEqual(result.state, 'startup')
    assert.strictEqual(result.upTime, 1)
  })

  await t.test('should ignore upTime when shutting down', () => {
    const result = detectPowerState('userShutdown', 10)
    assert.strictEqual(result.state, 'shutdown')
    assert.strictEqual(result.shutDownReason, 'userShutdown')
    assert.strictEqual(result.upTime, null)
  })
})
