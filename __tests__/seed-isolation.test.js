/**
 * Tests for database seeding logic (src/migrations/setup-db.js pattern).
 *
 * This test verifies the seed process works correctly by using a
 * mock domain list rather than the production config/domains.json.
 * No real database connections or production data are involved.
 *
 * All seed data uses fabricated ".test" TLD domains (RFC 2606).
 */

const DatabaseAdapter = require('../src/adapters/DatabaseAdapter');
const { MOCK_DOMAINS } = require('./fixtures/mock-domains');

describe('Database seeding (mocked)', () => {
  let db;

  beforeEach(async () => {
    db = new DatabaseAdapter();
    await db.connect();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  it('seeds the adapter from a mock domain list (not production data)', async () => {
    let seeded = 0;
    for (const entry of MOCK_DOMAINS) {
      await db.upsert(entry.domain, {
        priority: entry.priority,
        tier: entry.tier,
        category: entry.category,
        status: 'pending',
        findings: [],
        lastHuntedAt: null,
        error: null,
      });
      seeded++;
    }

    expect(seeded).toBe(MOCK_DOMAINS.length);
    expect(await db.count()).toBe(MOCK_DOMAINS.length);
  });

  it('each seeded mock record has correct initial status', async () => {
    for (const entry of MOCK_DOMAINS) {
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

    for (const entry of MOCK_DOMAINS) {
      const record = await db.findByDomain(entry.domain);
      expect(record).not.toBeNull();
      expect(record.status).toBe('pending');
      expect(record.findings).toEqual([]);
      expect(record.lastHuntedAt).toBeNull();
      expect(record.domain).toMatch(/\.test$/);
    }
  });

  it('re-seeding updates existing mock records without duplicating', async () => {
    // First seed
    for (const entry of MOCK_DOMAINS) {
      await db.upsert(entry.domain, { priority: entry.priority, status: 'pending' });
    }
    const countAfterFirst = await db.count();

    // Second seed (simulates re-run)
    for (const entry of MOCK_DOMAINS) {
      await db.upsert(entry.domain, { priority: entry.priority, status: 'pending' });
    }
    const countAfterSecond = await db.count();

    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('seeded mock data is queryable by category', async () => {
    for (const entry of MOCK_DOMAINS) {
      await db.upsert(entry.domain, {
        priority: entry.priority,
        category: entry.category,
      });
    }

    const testDomains = await db.findByCategory('test');
    expect(testDomains.length).toBe(
      MOCK_DOMAINS.filter((d) => d.category === 'test').length
    );
    for (const record of testDomains) {
      expect(record.domain).toMatch(/\.test$/);
    }
  });

  it('seeded mock data is queryable by minimum priority', async () => {
    for (const entry of MOCK_DOMAINS) {
      await db.upsert(entry.domain, { priority: entry.priority });
    }

    const highPriority = await db.findByMinPriority(15);
    expect(highPriority.every((r) => r.priority >= 15)).toBe(true);
    expect(highPriority.length).toBeGreaterThan(0);
  });
});
