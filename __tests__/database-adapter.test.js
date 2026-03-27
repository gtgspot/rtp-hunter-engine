/**
 * Tests for src/adapters/DatabaseAdapter.js
 *
 * All seed data uses fabricated mock domains with the ".test" TLD (RFC 2606).
 * The adapter under test is an in-memory store — no real database connections
 * or production data are involved.
 */

const DatabaseAdapter = require('../src/adapters/DatabaseAdapter');

describe('DatabaseAdapter', () => {
  let db;

  beforeEach(async () => {
    db = new DatabaseAdapter();
    await db.connect();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  it('starts with an empty store', async () => {
    expect(await db.count()).toBe(0);
  });

  describe('upsert / findByDomain', () => {
    it('inserts a mock domain record and retrieves it', async () => {
      const record = await db.upsert('mock-casino.test', {
        priority: 10,
        tier: 2,
        category: 'mock-operator',
        status: 'pending',
      });

      expect(record.domain).toBe('mock-casino.test');
      expect(record.priority).toBe(10);
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();

      const found = await db.findByDomain('mock-casino.test');
      expect(found).toEqual(record);
    });

    it('updates an existing mock domain record', async () => {
      await db.upsert('mock-casino.test', { priority: 10, status: 'pending' });
      const updated = await db.upsert('mock-casino.test', { priority: 10, status: 'completed' });

      expect(updated.status).toBe('completed');
      expect(await db.count()).toBe(1);
    });

    it('preserves createdAt on update', async () => {
      const first = await db.upsert('mock-casino.test', { priority: 5 });
      const second = await db.upsert('mock-casino.test', { priority: 5, status: 'active' });

      expect(second.createdAt).toBe(first.createdAt);
    });
  });

  describe('findByDomain (miss)', () => {
    it('returns null for a non-existent mock domain', async () => {
      const result = await db.findByDomain('nonexistent-casino.test');
      expect(result).toBeNull();
    });
  });

  describe('findByMinPriority', () => {
    it('returns mock records at or above a priority threshold', async () => {
      await db.upsert('low-priority.test', { priority: 5 });
      await db.upsert('mid-priority.test', { priority: 15 });
      await db.upsert('high-priority.test', { priority: 30 });

      const results = await db.findByMinPriority(15);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.priority >= 15)).toBe(true);
    });
  });

  describe('findByCategory', () => {
    it('returns mock records matching a category', async () => {
      await db.upsert('alpha.test', { category: 'mock-operator' });
      await db.upsert('beta.test', { category: 'mock-hub' });
      await db.upsert('gamma.test', { category: 'mock-operator' });

      const results = await db.findByCategory('mock-operator');
      expect(results).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('returns all seeded mock records', async () => {
      await db.upsert('alpha.test', { priority: 5 });
      await db.upsert('beta.test', { priority: 10 });

      const all = await db.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('removes a mock domain record', async () => {
      await db.upsert('to-delete.test', { priority: 5 });
      expect(await db.delete('to-delete.test')).toBe(true);
      expect(await db.findByDomain('to-delete.test')).toBeNull();
    });

    it('returns false when deleting a non-existent mock domain', async () => {
      expect(await db.delete('nonexistent.test')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all mock records', async () => {
      await db.upsert('alpha.test', { priority: 5 });
      await db.upsert('beta.test', { priority: 10 });
      await db.clear();
      expect(await db.count()).toBe(0);
    });
  });

  describe('seed isolation', () => {
    it('seeds from mock data without referencing production domains.json', async () => {
      // Simulate what setup-db.js does, but with mock data only
      const mockSeedData = [
        { domain: 'seed-alpha.test', priority: 5, tier: 1, category: 'test' },
        { domain: 'seed-beta.test', priority: 20, tier: 3, category: 'mock-operator' },
      ];

      for (const entry of mockSeedData) {
        await db.upsert(entry.domain, {
          priority: entry.priority,
          tier: entry.tier,
          category: entry.category,
          status: 'pending',
          findings: [],
          lastHuntedAt: null,
          error: null,
        });
      }

      expect(await db.count()).toBe(mockSeedData.length);
      const record = await db.findByDomain('seed-alpha.test');
      expect(record.status).toBe('pending');
      expect(record.category).toBe('test');
    });
  });
});
