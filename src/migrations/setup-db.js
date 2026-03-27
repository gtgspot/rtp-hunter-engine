'use strict';

const DatabaseAdapter = require('../adapters/DatabaseAdapter');
const domainsData = require('../../config/domains.json');

/**
 * Database schema initialization script.
 *
 * Seeds the in-memory DatabaseAdapter with all domains from config/domains.json
 * so that the application starts with a fully-populated domain record store.
 *
 * For production use, replace DatabaseAdapter with a real persistence layer
 * (MongoDB, PostgreSQL, SQLite, etc.) and update the upsert calls accordingly.
 *
 * @param {DatabaseAdapter} [adapter] - Optional adapter instance. Creates a new one if not provided.
 * @returns {Promise<{adapter: DatabaseAdapter, seeded: number}>} The initialized adapter and seed count.
 */
async function setupDatabase(adapter) {
  const db = adapter || new DatabaseAdapter();
  await db.connect();

  console.log('[setup-db] Connected to database.');
  console.log(`[setup-db] Seeding ${domainsData.length} domains...`);

  let seeded = 0;
  for (const entry of domainsData) {
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

  const total = await db.count();
  console.log(`[setup-db] Seeding complete. Total records in store: ${total}`);

  return { adapter: db, seeded };
}

module.exports = { setupDatabase };

// Allow running directly: node src/migrations/setup-db.js
if (require.main === module) {
  setupDatabase()
    .then(({ seeded }) => {
      console.log(`[setup-db] Done. Seeded ${seeded} domain records.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[setup-db] Error:', err);
      process.exit(1);
    });
}
