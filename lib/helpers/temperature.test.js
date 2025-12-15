import test from 'node:test'
import assert from 'node:assert'
import { parseTemperature } from './temperature.js'

test('parseTemperature', async (t) => {
  await t.test('should parse standard two-part format', () => {
    assert.strictEqual(parseTemperature('0:19'), 19)
    assert.strictEqual(parseTemperature('0:25'), 25)
    assert.strictEqual(parseTemperature('0:0'), 0)
  })

  await t.test('should parse three-part format using middle value', () => {
    assert.strictEqual(parseTemperature('12:20:23'), 20)
    assert.strictEqual(parseTemperature('10:15:20'), 15)
    assert.strictEqual(parseTemperature('0:42:100'), 42)
  })

  await t.test('should return null for unavailable/unsupported', () => {
    assert.strictEqual(parseTemperature('0:unavailable'), null)
    assert.strictEqual(parseTemperature('0:notSupported'), null)
    assert.strictEqual(parseTemperature('notSupported'), null)
  })

  await t.test('should handle null and undefined', () => {
    assert.strictEqual(parseTemperature(null), null)
    assert.strictEqual(parseTemperature(undefined), null)
  })

  await t.test('should handle empty string', () => {
    assert.strictEqual(parseTemperature(''), null)
  })

  await t.test('should parse plain numbers as fallback', () => {
    assert.strictEqual(parseTemperature('25'), 25)
    assert.strictEqual(parseTemperature('0'), 0)
    assert.strictEqual(parseTemperature(25), 25)
    assert.strictEqual(parseTemperature(0), 0)
  })

  await t.test('should handle decimal temperatures', () => {
    assert.strictEqual(parseTemperature('0:19.5'), 19.5)
    assert.strictEqual(parseTemperature('12:20.75:23'), 20.75)
    assert.strictEqual(parseTemperature('19.5'), 19.5)
  })

  await t.test('should handle negative temperatures', () => {
    assert.strictEqual(parseTemperature('0:-5'), -5)
    assert.strictEqual(parseTemperature('10:-2:15'), -2)
    assert.strictEqual(parseTemperature('-5'), -5)
  })

  await t.test('should return null for invalid formats', () => {
    assert.strictEqual(parseTemperature('invalid'), null)
    assert.strictEqual(parseTemperature('abc:xyz'), null)
    assert.strictEqual(parseTemperature(':'), null)
    assert.strictEqual(parseTemperature('::'), null)
  })
})
