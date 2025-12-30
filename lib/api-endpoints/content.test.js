import test from 'node:test'
import assert from 'node:assert'
import { getContent, getUserMyoContent } from './content.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens, logResponse } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('getUserMyoContent', async (t) => {
  await t.test('should fetch user MYO cards', async () => {
    const response = await getUserMyoContent({
      accessToken: await token.getAccessToken()
    })

    // Log response for type verification and documentation
    logResponse('GET /content/mine', response)

    // Validate response structure matches YotoMyoContentResponse
    assert.ok(response, 'Response should exist')
    assert.ok(Array.isArray(response.cards), 'Response should have cards array')
    assert.ok(response.cards.length > 0, 'User should have at least one card')

    // Validate card structure
    const card = response.cards[0]
    assert.ok(card, 'Card should exist')
    assert.ok(typeof card.cardId === 'string', 'Card should have cardId string')
    assert.ok(typeof card.title === 'string', 'Card should have title string')
    assert.ok(typeof card.createdAt === 'string', 'Card should have createdAt string')
    assert.ok(typeof card.updatedAt === 'string', 'Card should have updatedAt string')
    assert.ok(typeof card.userId === 'string', 'Card should have userId string')
    assert.ok(card.content, 'Card should have content object')
    assert.ok(card.metadata, 'Card should have metadata object')
    assert.ok(card.metadata.media, 'Metadata should have media object')
    assert.ok(typeof card.metadata.media.duration === 'number', 'Media should have duration number')

    // Validate metadata category enum if present and non-empty
    if (card.metadata.category && card.metadata.category.length > 0) {
      const validCategories = ['none', 'stories', 'music', 'radio', 'podcast', 'sfx', 'activities', 'alarms']
      assert.ok(validCategories.includes(card.metadata.category), `Metadata category should be valid: ${card.metadata.category}`)
    }

    // Validate optional metadata fields if present
    if (card.metadata.languages) {
      const validLanguages = ['en', 'en-gb', 'en-us', 'fr', 'fr-fr', 'es', 'es-es', 'es-419', 'de', 'it']
      assert.ok(Array.isArray(card.metadata.languages), 'Metadata languages should be array')
      card.metadata.languages.forEach(lang => {
        assert.ok(validLanguages.includes(lang), `Language should be valid: ${lang}`)
      })
    }

    if (card.metadata.status) {
      const validStatuses = ['new', 'inprogress', 'complete', 'live', 'archived']
      assert.ok(validStatuses.includes(card.metadata.status.name), `Status name should be valid: ${card.metadata.status.name}`)
      assert.ok(typeof card.metadata.status.updatedAt === 'string', 'Status should have updatedAt string')
    }

    if (card.metadata.playbackDirection) {
      assert.ok(['DESC', 'ASC'].includes(card.metadata.playbackDirection), 'Playback direction should be DESC or ASC')
    }
  })

  await t.test('should accept showDeleted parameter', async () => {
    const response = await getUserMyoContent({
      accessToken: await token.getAccessToken(),
      showDeleted: true
    })

    assert.ok(response, 'Response should exist')
    assert.ok(Array.isArray(response.cards), 'Response should have cards array')
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getUserMyoContent({
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

test('getContent', async (t) => {
  /** @type {string[]} */
  let testCardIds = []

  // Get real card IDs to test with
  await t.test('setup - get card IDs from user content', async () => {
    const response = await getUserMyoContent({
      accessToken: await token.getAccessToken()
    })

    assert.ok(response.cards.length > 0, 'User should have at least one card for getContent tests')

    testCardIds = response.cards.slice(0, 3).map(card => card.cardId).filter(Boolean)
    assert.ok(testCardIds.length > 0, 'Should have extracted at least one card ID')
  })

  await t.test('should fetch content for valid card IDs', async () => {
    // Test with multiple cards to ensure consistency
    for (const cardId of testCardIds) {
      const content = await getContent({
        accessToken: await token.getAccessToken(),
        cardId
      })

      // Log response for type verification and documentation
      logResponse(`GET /content/${cardId}`, content)

      // Validate response structure matches YotoContentResponse
      assert.ok(content, 'Response should exist')
      assert.ok(content.card, 'Response should have card property')
      assert.strictEqual(content.card.cardId, cardId, 'Returned card ID should match requested ID')
      assert.ok(typeof content.card.title === 'string', 'Card should have title')
      assert.ok(typeof content.card.createdAt === 'string', 'Card should have createdAt')
      assert.ok(typeof content.card.updatedAt === 'string', 'Card should have updatedAt')
      assert.ok(content.card.content, 'Card should have content property')
      assert.ok(Array.isArray(content.card.content.chapters), 'Content should have chapters array')
      assert.ok(content.card.metadata, 'Card should have metadata')

      // Validate metadata category enum if present and non-empty
      if (content.card.metadata.category && content.card.metadata.category.length > 0) {
        const validCategories = ['none', 'stories', 'music', 'radio', 'podcast', 'sfx', 'activities', 'alarms']
        assert.ok(validCategories.includes(content.card.metadata.category), `Metadata category should be valid: ${content.card.metadata.category}`)
      }

      // Validate optional playbackType if present
      if (content.card.content.playbackType) {
        const validPlaybackTypes = ['linear', 'interactive']
        assert.ok(validPlaybackTypes.includes(content.card.content.playbackType), `Playback type should be valid: ${content.card.content.playbackType}`)
      }
    }
  })

  await t.test('should include chapters in content', async () => {
    const cardId = testCardIds[0]
    assert.ok(cardId, 'Card ID should exist')

    const content = await getContent({
      accessToken: await token.getAccessToken(),
      cardId
    })

    // Chapters array should exist (may be empty for some cards)
    assert.ok(Array.isArray(content.card.content.chapters), 'Should have chapters array')

    // If chapters exist, validate their structure matches YotoChapter type
    if (content.card.content.chapters.length > 0) {
      const chapter = content.card.content.chapters[0]
      assert.ok(chapter, 'Chapter should exist')

      // Validate chapter structure
      assert.ok(typeof chapter.key === 'string', 'Chapter should have key string')
      assert.ok(typeof chapter.title === 'string', 'Chapter should have title string')
      assert.ok(typeof chapter.overlayLabel === 'string', 'Chapter should have overlayLabel string')
      assert.ok(Array.isArray(chapter.tracks), 'Chapter should have tracks array')
      assert.ok(chapter.display, 'Chapter should have display object')
      assert.ok(typeof chapter.display.icon16x16 === 'string', 'Chapter display should have icon16x16 string')
      assert.ok(typeof chapter.duration === 'number', 'Chapter should have duration number')
      assert.ok(typeof chapter.fileSize === 'number', 'Chapter should have fileSize number')
      assert.ok('availableFrom' in chapter, 'Chapter should have availableFrom property')
      assert.ok('ambient' in chapter, 'Chapter should have ambient property')
      assert.ok('defaultTrackDisplay' in chapter, 'Chapter should have defaultTrackDisplay property')
      assert.ok('defaultTrackAmbient' in chapter, 'Chapter should have defaultTrackAmbient property')

      // If tracks exist, validate their structure matches YotoTrack type
      if (chapter.tracks.length > 0) {
        const track = chapter.tracks[0]
        assert.ok(track, 'Track should exist')

        // Validate track structure
        assert.ok(typeof track.key === 'string', 'Track should have key string')
        assert.ok(typeof track.title === 'string', 'Track should have title string')
        assert.ok(typeof track.trackUrl === 'string', 'Track should have trackUrl string')
        assert.ok(track.trackUrl.startsWith('yoto:#'), 'Track URL should start with "yoto:#"')
        assert.ok(typeof track.format === 'string', 'Track should have format string')

        // Validate audio format enum
        const validFormats = ['mp3', 'aac', 'opus', 'ogg']
        assert.ok(validFormats.includes(track.format), `Track format should be valid: ${track.format}`)

        assert.ok(track.type === 'audio' || track.type === 'stream', 'Track type should be "audio" or "stream"')
        assert.ok(typeof track.overlayLabel === 'string', 'Track should have overlayLabel string')
        assert.ok(typeof track.duration === 'number', 'Track should have duration number')
        assert.ok(typeof track.fileSize === 'number', 'Track should have fileSize number')
        assert.ok(track.channels === 'stereo' || track.channels === 'mono', 'Track channels should be "stereo" or "mono"')
        assert.ok('ambient' in track, 'Track should have ambient property')
        assert.ok(track.display, 'Track should have display object')
        assert.ok(typeof track.display.icon16x16 === 'string', 'Track display should have icon16x16 string')
        assert.ok(track.display.icon16x16.startsWith('yoto:#'), 'Track display icon should start with "yoto:#"')
      }
    }
  })

  await t.test('should accept timezone parameter for podcast content', async () => {
    const cardId = testCardIds[0]
    assert.ok(cardId, 'Card ID should exist')

    const content = await getContent({
      accessToken: await token.getAccessToken(),
      cardId,
      timezone: 'Pacific/Auckland'
    })

    // Log response with timezone parameter
    logResponse('GET /content/{cardId}?timezone=Pacific/Auckland', content)

    assert.ok(content.card, 'Should return content with timezone parameter')
    assert.strictEqual(content.card.cardId, cardId, 'Should return correct card')
  })

  await t.test('should accept playable parameter for signed URLs', async () => {
    const cardId = testCardIds[0]
    assert.ok(cardId, 'Card ID should exist')

    const content = await getContent({
      accessToken: await token.getAccessToken(),
      cardId,
      playable: true,
      signingType: 's3'
    })

    // Log response with playable URLs
    logResponse('GET /content/{cardId}?playable=true&signingType=s3', content)

    assert.ok(content.card, 'Should return content with playable URLs')
    assert.strictEqual(content.card.cardId, cardId, 'Should return correct card')
  })
})

// TODO: Add tests for createOrUpdateContent
// - should create new content without cardId
// - should return created card with generated cardId
// - should update existing content with cardId
// - should validate response structure matches YotoCreateOrUpdateContentResponse
// - should fail with invalid token
// - should accept all content fields (chapters, config, metadata)

// TODO: Add tests for deleteContent
// - should delete content successfully
// - should return status 'ok'
// - should fail with 404 for non-existent cardId
// - should fail with 404 when trying to delete content user didn't create
// - should fail with invalid token
