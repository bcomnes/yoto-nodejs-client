import test from 'node:test'
import assert from 'node:assert'
import { getGroups, createGroup, getGroup, updateGroup, deleteGroup } from './family-library-groups.js'
import { YotoAPIError } from './helpers.js'
import { loadTestTokens, logResponse } from './endpoint-test-helpers.js'

const { token } = loadTestTokens()

test('getGroups', async (t) => {
  await t.test('should fetch family library groups', async () => {
    const response = await getGroups({
      accessToken: await token.getAccessToken()
    })

    // Log response for type verification and documentation
    logResponse('GET /card/family/library/groups', response)

    // Validate response structure matches YotoGroup[]
    assert.ok(response, 'Response should exist')
    assert.ok(Array.isArray(response), 'Response should be an array')

    // Note: User may not have any groups, so we only validate structure if groups exist
    if (response.length > 0) {
      const group = response[0]
      assert.ok(group, 'Group should exist')
      assert.ok(typeof group.id === 'string', 'Group should have id string')
      assert.ok(typeof group.name === 'string', 'Group should have name string')
      assert.ok(typeof group.familyId === 'string', 'Group should have familyId string')
      assert.ok(typeof group.imageId === 'string', 'Group should have imageId string')
      assert.ok(typeof group.imageUrl === 'string', 'Group should have imageUrl string')
      assert.ok(Array.isArray(group.items), 'Group should have items array')
      assert.ok(Array.isArray(group.cards), 'Group should have cards array')
      assert.ok(typeof group.createdAt === 'string', 'Group should have createdAt string')
      assert.ok(typeof group.lastModifiedAt === 'string', 'Group should have lastModifiedAt string')

      // Validate items structure if items exist
      if (group.items.length > 0) {
        const item = group.items[0]
        assert.ok(item, 'Item should exist')
        assert.ok(typeof item.contentId === 'string', 'Item should have contentId string')
        assert.ok(typeof item.addedAt === 'string', 'Item should have addedAt string')
      }
    }
  })

  await t.test('should fail with invalid token', async () => {
    await assert.rejects(
      async () => {
        await getGroups({
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

test('CRUD operations - full lifecycle', async (t) => {
  /** @type {string[]} */
  let createdGroupIds = []
  /** @type {string} */
  let group1Id
  /** @type {string} */
  let group2Id

  // Cleanup function to run after all tests
  t.after(async () => {
    console.log('\n🧹 Cleaning up test groups...')
    for (const groupId of createdGroupIds) {
      try {
        await deleteGroup({ accessToken: await token.getAccessToken(), groupId })
        console.log(`  ✓ Deleted group: ${groupId}`)
      } catch (err) {
        console.log(`  ⚠️  Failed to delete group ${groupId}:`, /** @type {Error} */(err).message)
      }
    }
  })

  await t.test('should create first group', async () => {
    const group = await createGroup({
      accessToken: await token.getAccessToken(),
      group: {
        name: 'Test Group 1',
        imageId: 'fp-cards',
        items: []
      }
    })

    logResponse('POST /card/family/library/groups (group 1)', group)

    // Validate response structure
    assert.ok(group, 'Response should exist')
    assert.ok(typeof group.id === 'string', 'Group should have id string')
    assert.strictEqual(group.name, 'Test Group 1', 'Group name should match')
    assert.strictEqual(group.imageId, 'fp-cards', 'Image ID should match')
    assert.ok(Array.isArray(group.items), 'Group should have items array')
    assert.strictEqual(group.items.length, 0, 'Items should be empty')
    assert.ok(Array.isArray(group.cards), 'Group should have cards array')
    assert.ok(typeof group.familyId === 'string', 'Group should have familyId')
    assert.ok(typeof group.createdAt === 'string', 'Group should have createdAt')
    assert.ok(typeof group.lastModifiedAt === 'string', 'Group should have lastModifiedAt')

    group1Id = group.id
    createdGroupIds.push(group.id)
  })

  await t.test('should create second group', async () => {
    const group = await createGroup({
      accessToken: await token.getAccessToken(),
      group: {
        name: 'Test Group 2',
        imageId: 'fp-cards',
        items: []
      }
    })

    logResponse('POST /card/family/library/groups (group 2)', group)

    // Validate response structure
    assert.ok(group, 'Response should exist')
    assert.ok(typeof group.id === 'string', 'Group should have id string')
    assert.strictEqual(group.name, 'Test Group 2', 'Group name should match')
    assert.notStrictEqual(group.id, group1Id, 'Group IDs should be different')

    group2Id = group.id
    createdGroupIds.push(group.id)
  })

  await t.test('should list groups and find both created groups', async () => {
    const groups = await getGroups({
      accessToken: await token.getAccessToken(),
    })

    logResponse('GET /card/family/library/groups (after creating 2)', groups)

    assert.ok(Array.isArray(groups), 'Response should be an array')
    assert.ok(groups.length >= 2, 'Should have at least 2 groups')

    const foundGroup1 = groups.find(g => g.id === group1Id)
    const foundGroup2 = groups.find(g => g.id === group2Id)

    assert.ok(foundGroup1, 'Should find first created group in list')
    assert.strictEqual(foundGroup1.name, 'Test Group 1', 'First group name should match')

    assert.ok(foundGroup2, 'Should find second created group in list')
    assert.strictEqual(foundGroup2.name, 'Test Group 2', 'Second group name should match')
  })

  await t.test('should get first group by ID', async () => {
    const group = await getGroup({
      accessToken: await token.getAccessToken(),
      groupId: group1Id
    })

    logResponse(`GET /card/family/library/groups/${group1Id}`, group)

    assert.ok(group, 'Response should exist')
    assert.strictEqual(group.id, group1Id, 'Group ID should match')
    assert.strictEqual(group.name, 'Test Group 1', 'Group name should match')
    assert.strictEqual(group.imageId, 'fp-cards', 'Image ID should match')
    assert.ok(Array.isArray(group.items), 'Group should have items array')
    assert.ok(Array.isArray(group.cards), 'Group should have cards array')
  })

  await t.test('should get second group by ID', async () => {
    const group = await getGroup({
      accessToken: await token.getAccessToken(),
      groupId: group2Id
    })

    logResponse(`GET /card/family/library/groups/${group2Id}`, group)

    assert.ok(group, 'Response should exist')
    assert.strictEqual(group.id, group2Id, 'Group ID should match')
    assert.strictEqual(group.name, 'Test Group 2', 'Group name should match')
  })

  await t.test('should update first group', async () => {
    const updatedGroup = await updateGroup({
      accessToken: await token.getAccessToken(),
      groupId: group1Id,
      group: {
        name: 'Test Group 1 - Updated',
        imageId: 'fp-cards',
        items: []
      }
    })

    logResponse(`PUT /card/family/library/groups/${group1Id}`, updatedGroup)

    assert.ok(updatedGroup, 'Response should exist')
    assert.strictEqual(updatedGroup.id, group1Id, 'Group ID should remain the same')
    assert.strictEqual(updatedGroup.name, 'Test Group 1 - Updated', 'Group name should be updated')
    assert.ok(typeof updatedGroup.lastModifiedAt === 'string', 'Should have lastModifiedAt')
  })

  await t.test('should get updated group and confirm changes', async () => {
    const group = await getGroup({
      accessToken: await token.getAccessToken(),
      groupId: group1Id
    })

    logResponse(`GET /card/family/library/groups/${group1Id} (after update)`, group)

    assert.strictEqual(group.name, 'Test Group 1 - Updated', 'Updated name should persist')
  })

  await t.test('should delete first group', async () => {
    const response = await deleteGroup({
      accessToken: await token.getAccessToken(),
      groupId: group1Id
    })

    logResponse(`DELETE /card/family/library/groups/${group1Id}`, response)

    assert.ok(response, 'Response should exist')
    assert.strictEqual(response.id, group1Id, 'Deleted group ID should match')

    // Remove from cleanup list since we already deleted it
    createdGroupIds = createdGroupIds.filter(id => id !== group1Id)
  })

  await t.test('should delete second group', async () => {
    const response = await deleteGroup({
      accessToken: await token.getAccessToken(),
      groupId: group2Id
    })

    logResponse(`DELETE /card/family/library/groups/${group2Id}`, response)

    assert.ok(response, 'Response should exist')
    assert.strictEqual(response.id, group2Id, 'Deleted group ID should match')

    // Remove from cleanup list since we already deleted it
    createdGroupIds = createdGroupIds.filter(id => id !== group2Id)
  })

  await t.test('should verify groups are deleted from list', async () => {
    const groups = await getGroups({
      accessToken: await token.getAccessToken()
    })

    logResponse('GET /card/family/library/groups (after deletion)', groups)

    const foundGroup1 = groups.find(g => g.id === group1Id)
    const foundGroup2 = groups.find(g => g.id === group2Id)

    assert.strictEqual(foundGroup1, undefined, 'First group should not be in list')
    assert.strictEqual(foundGroup2, undefined, 'Second group should not be in list')
  })

  await t.test('should return 404 when getting deleted group', async () => {
    await assert.rejects(
      async () => {
        await getGroup({
          accessToken: await token.getAccessToken(),
          groupId: group1Id
        })
      },
      (err) => {
        assert.ok(err instanceof YotoAPIError, 'Should throw YotoAPIError')
        assert.strictEqual(err.statusCode, 404, 'Should return 404 for deleted group')
        return true
      }
    )
  })
})
