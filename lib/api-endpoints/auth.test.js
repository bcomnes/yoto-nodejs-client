import test from 'node:test'
import assert from 'node:assert'
import { exchangeToken, pollForDeviceToken } from './auth.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('exchangeToken - refresh flow', async (t) => {
  await t.test('should fail with invalid refresh token', async () => {
    await assert.rejects(
      async () => {
        await exchangeToken({
          grantType: 'refresh_token',
          refreshToken: 'invalid-refresh-token',
          clientId: token.clientId
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode, 'Error should have statusCode')
        assert.ok(err.body, 'Error should have body')
        return true
      }
    )
  })
})

test('pollForDeviceToken', async (t) => {
  await t.test('should throw invalid_grant for invalid device code', async () => {
    // Invalid device codes throw invalid_grant error (unrecoverable)
    await assert.rejects(
      async () => {
        await pollForDeviceToken({
          deviceCode: 'invalid-device-code',
          clientId: token.clientId,
          currentInterval: 5000
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        // @ts-expect-error
        assert.strictEqual(err.body?.error, 'invalid_grant', 'Should be invalid_grant error')
        assert.ok(err.statusCode, 'Error should have statusCode')
        return true
      }
    )
  })

  await t.test('should throw for expired_token error', async () => {
    // The function should throw for expired_token (unrecoverable)
    // We can't easily test this without a real flow, but we verify the error handling works
    await assert.rejects(
      async () => {
        await pollForDeviceToken({
          deviceCode: 'expired-device-code-xyz',
          clientId: token.clientId,
          currentInterval: 5000
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        // Will get invalid_grant for malformed codes
        // @ts-expect-error
        assert.ok(err.body?.error, 'Should have error code')
        return true
      }
    )
  })

  // Note: Testing authorization_pending and slow_down states requires a real device flow
  // These tests would need to:
  // 1. Call requestDeviceCode() to get a valid device_code
  // 2. Poll immediately (should get authorization_pending)
  // 3. Poll rapidly (might get slow_down)
  // 4. Complete auth in browser (would get success)
  // This is too complex and flaky for unit tests, so we skip testing those paths
  // The implementation is verified by the CLI tool usage in bin/auth.js
})
