import test from 'node:test'
import assert from 'node:assert'
import { getFamilyImages, getAFamilyImage } from './family.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens, logResponse } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('getFamilyImages', async (t) => {
  await t.test('should fetch user family images', async () => {
    const response = await getFamilyImages({
      accessToken: await token.getAccessToken()
    })

    // Log response for type verification and documentation
    logResponse('GET /media/family/images', response)

    // Validate response structure matches YotoFamilyImagesResponse
    assert.ok(response, 'Response should exist')
    assert.ok(Array.isArray(response.images), 'Response should have images array')

    // Note: User may not have any family images, so we only validate structure if images exist
    if (response.images.length > 0) {
      const image = response.images[0]
      assert.ok(image, 'Image should exist')
      assert.equal(typeof image.imageId, 'string', 'Image should have imageId string')
    }
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getFamilyImages({
          accessToken: 'invalid-token'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 401 || err.statusCode === 403, 'Should return 401 or 403 for invalid token')
        assert.ok(err.jsonBody, 'Error should have jsonBody')
        return true
      }
    )
  })
})

test('getAFamilyImage', async (t) => {
  /** @type {string[]} */
  let testImageIds = []

  // Get real image IDs to test with
  await t.test('setup - get image IDs from family images', async () => {
    const response = await getFamilyImages({
      accessToken: await token.getAccessToken()
    })

    if (response.images.length === 0) {
      console.log('⚠️  User has no family images - getAFamilyImage tests will be skipped')
      return
    }

    testImageIds = response.images.slice(0, 2).map(image => image.imageId).filter(Boolean)
    assert.ok(testImageIds.length > 0, 'Should have extracted at least one image ID')
  })

  await t.test('should fetch family image signed URL', async () => {
    if (testImageIds.length === 0) {
      console.log('⚠️  Skipping - no family images available')
      return
    }

    const imageId = testImageIds[0]
    assert.ok(imageId, 'Image ID should exist')

    const response = await getAFamilyImage({
      accessToken: await token.getAccessToken(),
      imageId,
      size: '640x480'
    })

    // Log response for type verification and documentation
    logResponse('GET /media/family/images/{imageId}', response)

    // Validate response structure matches YotoFamilyImageResponse
    assert.ok(response, 'Response should exist')
    assert.equal(typeof response.imageUrl, 'string', 'Response should have imageUrl string')
    assert.ok(response.imageUrl.startsWith('http'), 'Image URL should be a valid URL')
  })

  await t.test('should fetch family image with size 640x480', async () => {
    if (testImageIds.length === 0) {
      console.log('⚠️  Skipping - no family images available')
      return
    }

    const imageId = testImageIds[0]
    assert.ok(imageId, 'Image ID should exist')

    const response = await getAFamilyImage({
      accessToken: await token.getAccessToken(),
      imageId,
      size: '640x480'
    })

    assert.ok(response, 'Response should exist')
    assert.equal(typeof response.imageUrl, 'string', 'Response should have imageUrl string')
    assert.ok(response.imageUrl.startsWith('http'), 'Image URL should be a valid URL')
  })

  await t.test('should fetch family image with size 320x320', async () => {
    if (testImageIds.length === 0) {
      console.log('⚠️  Skipping - no family images available')
      return
    }

    const imageId = testImageIds[0]
    assert.ok(imageId, 'Image ID should exist')

    const response = await getAFamilyImage({
      accessToken: await token.getAccessToken(),
      imageId,
      size: '320x320'
    })

    assert.ok(response, 'Response should exist')
    assert.equal(typeof response.imageUrl, 'string', 'Response should have imageUrl string')
    assert.ok(response.imageUrl.startsWith('http'), 'Image URL should be a valid URL')
  })

  await t.test('should fail with invalid image ID', async () => {
    await assert.rejects(
      async () => {
        await getAFamilyImage({
          accessToken: await token.getAccessToken(),
          imageId: 'invalid-image-id-12345',
          size: '640x480'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 404 || err.statusCode === 400, 'Should return 404 or 400 for invalid image ID')
        return true
      }
    )
  })

  await t.test('should fail with invalid token', async () => {
    if (testImageIds.length === 0) {
      console.log('⚠️  Skipping - no family images available')
      return
    }

    const imageId = testImageIds[0]
    assert.ok(imageId, 'Image ID should exist')

    await assert.rejects(
      async () => {
        await getAFamilyImage({
          accessToken: 'invalid-token',
          imageId,
          size: '640x480'
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.ok(err.statusCode === 401 || err.statusCode === 403, 'Should return 401 or 403 for invalid token')
        assert.ok(err.jsonBody, 'Error should have jsonBody')
        return true
      }
    )
  })
})

// TODO: Add tests for uploadAFamilyImage
// - should upload a valid JPEG image
// - should upload a valid PNG image
// - should upload a valid GIF image
// - should return imageId (SHA256 checksum) and url
// - should deduplicate identical images (same SHA256)
// - should fail with file larger than 8mb
// - should fail with unsupported image format
// - should fail when family has reached 500 image limit
// - should fail with invalid token
// - should validate response structure matches YotoUploadFamilyImageResponse
