import test from 'node:test'
import assert from 'node:assert'
import { getPublicIcons, getUserIcons } from './icons.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens, logResponse } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('getPublicIcons', async (t) => {
  await t.test('should fetch public display icons', async () => {
    const response = await getPublicIcons({
      accessToken: await token.getAccessToken(),
    })

    // Log response for type verification and documentation
    logResponse('GET /media/displayIcons/user/yoto', response)

    // Validate response structure matches YotoPublicIconsResponse
    assert.ok(response, 'Response should exist')
    assert.ok(response.displayIcons, 'Response should have displayIcons property')
    assert.ok(Array.isArray(response.displayIcons), 'displayIcons should be an array')
    assert.ok(response.displayIcons.length > 0, 'Should have at least one public icon')

    // Validate icon structure
    const icon = response.displayIcons[0]
    assert.ok(icon, 'Icon should exist')
    assert.ok(typeof icon.displayIconId === 'string', 'Icon should have displayIconId string')
    assert.ok(typeof icon.mediaId === 'string', 'Icon should have mediaId string')
    assert.ok(typeof icon.userId === 'string', 'Icon should have userId string')
    assert.strictEqual(icon.userId, 'yoto', 'Public icon userId should be "yoto"')
    assert.ok(typeof icon.createdAt === 'string', 'Icon should have createdAt string')
    assert.ok(typeof icon.title === 'string', 'Icon should have title string')
    assert.ok(typeof icon.url === 'string', 'Icon should have url string')
    assert.ok(icon.url.startsWith('http'), 'Icon URL should be a valid URL')
    assert.strictEqual(icon.public, true, 'Public icon should have public=true')
    // Note: new field may not always be present in public icons
    if (icon.new !== undefined) {
      assert.strictEqual(typeof icon.new, 'boolean', 'Icon new should be boolean when present')
    }
    assert.ok(Array.isArray(icon.publicTags), 'Icon should have publicTags array')
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getPublicIcons({
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

test('getUserIcons', async (t) => {
  await t.test('should fetch user custom icons', async () => {
    const response = await getUserIcons({
      accessToken: await token.getAccessToken()
    })

    // Log response for type verification and documentation
    logResponse('GET /media/displayIcons/user/me', response)

    // Validate response structure matches YotoUserIconsResponse
    assert.ok(response, 'Response should exist')
    assert.ok(response.displayIcons, 'Response should have displayIcons property')
    assert.ok(Array.isArray(response.displayIcons), 'displayIcons should be an array')

    // Note: User may not have any custom icons, so we only validate structure if icons exist
    if (response.displayIcons.length > 0) {
      const icon = response.displayIcons[0]
      assert.ok(icon, 'Icon should exist')
      assert.ok(typeof icon.displayIconId === 'string', 'Icon should have displayIconId string')
      assert.ok(typeof icon.mediaId === 'string', 'Icon should have mediaId string')
      assert.ok(typeof icon.userId === 'string', 'Icon should have userId string')
      assert.ok(typeof icon.createdAt === 'string', 'Icon should have createdAt string')
      assert.ok(typeof icon.url === 'string', 'Icon should have url string')
      assert.strictEqual(icon.public, false, 'User icon should have public=false')
      assert.strictEqual('title' in icon, false, 'User icon should not have title')
      assert.strictEqual('publicTags' in icon, false, 'User icon should not have publicTags')
    }
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getUserIcons({
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

// TODO: Add tests for uploadIcon
// - should upload a new icon with autoConvert=true
// - should return new=true for first upload
// - should validate response structure matches YotoUploadIconResponse
// - should upload icon with custom filename
// - should handle re-upload of same icon (deduplication)
// - should return existing icon with url={} for duplicate
// - should list user icons and find uploaded icon
// - should upload icon with autoConvert=false (strict mode)
// - should fail with invalid dimensions when autoConvert=false
// - should fail with invalid format when autoConvert=false
// - should fail with file that's not an image
// - should fail with invalid token
