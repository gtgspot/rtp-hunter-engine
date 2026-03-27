# Migration Guide

This guide helps you migrate from the legacy single-endpoint server to the enhanced domain management architecture.

---

## What Changed

| Area | Before | After |
|------|--------|-------|
| Domain data | Hard-coded `example*.com` placeholders in `src/config/domains.js` | 400+ real domains in `config/domains.json` |
| Domain management | No management layer | `DomainManager` with grouping, filtering, stratification |
| Processing | Single-domain `huntRTP()` call | `BulkHunterService` with concurrency + rate limiting |
| Server routes | Single `GET /hunt` stub | Full REST API for domains, bulk hunting, and reporting |
| Persistence | None | `DatabaseAdapter` (in-memory; swappable) |
| Results | Raw array returned | Structured `ResultAggregator` reports |

---

## Step-by-Step Migration

### 1. Domain Data

The legacy `src/config/domains.js` placeholder list has been replaced. The file now loads `config/domains.json` and re-exports the same helper API for backward compatibility.

**Before:**
```js
const { organizeByPriority } = require('./src/config/domains');
// Returned 4 placeholder domains
```

**After:**
```js
const { organizeByPriority, domains } = require('./src/config/domains');
// Returns 400+ real domains organized by priority
```

No call-site changes are required.

---

### 2. Single-Domain Hunting

The `huntRTP` function signature is unchanged. Existing callers continue to work.

```js
// Still works exactly as before
const { huntRTP } = require('./rtp-hunter');
const results = await huntRTP('matbet88.com');
```

---

### 3. Bulk Hunting

Replace manual loops with `BulkHunterService`:

**Before (manual loop):**
```js
const results = [];
for (const domain of myDomains) {
  results.push(await huntRTP(domain));
}
```

**After (concurrent with rate limiting):**
```js
const { huntRTP } = require('./rtp-hunter');
const BulkHunterService = require('./src/services/BulkHunterService');

const service = new BulkHunterService(huntRTP, {
  concurrencyLimit: 5,
  rateLimitMs: 1000,
  retries: 2,
});

const { results, errors, summary } = await service.processDomains(domains);
```

---

### 4. Domain Queries

**Before:** No query capability.

**After:**
```js
const DomainManager = require('./src/managers/DomainManager');
const manager = new DomainManager();

// Get all matbet88 domains
const matbetDomains = manager.getByCategory('matbet88');

// Get all tier-4 domains
const highValueDomains = manager.getByTier(4);

// Get domains by priority range
const priority40Plus = manager.filterByPriorityRange(40);

// Priority-stratified batches (high priority first)
const batches = manager.getStratifiedBatches(10);
```

---

### 5. Converting a Legacy Domain Array

If you have an existing PHP-style domain array, use the migration script:

```bash
# From a file
node scripts/migrate-domains.js legacy-domains.txt config/domains.json

# From stdin
cat legacy-domains.txt | node scripts/migrate-domains.js > config/domains.json
```

Expected input format:
```
[matbet88.com] => 43
[matbet88.live] => 43
[u2wallet9.com] => 48
```

---

### 6. Server Endpoints

The legacy `GET /hunt` stub has been replaced. Update any clients:

| Old | New |
|-----|-----|
| `GET /hunt` | `GET /hunt/:domain` |
| — | `POST /hunt/bulk` |
| — | `GET /domains` |
| — | `GET /domains/summary` |
| — | `GET /report` |
| — | `GET /health` |

---

### 7. Database Initialization

To seed the in-memory store at startup:

```js
const { setupDatabase } = require('./src/migrations/setup-db');
const { adapter } = await setupDatabase();
```

Or run directly:
```bash
node src/migrations/setup-db.js
```

---

## Rollback

All changes are **additive**. The original `rtp-hunter.js` and `SpinSimulationEngine.js` files are unchanged. To revert to the legacy server, restore `server.js` from git history:

```bash
git checkout HEAD~1 -- server.js
```
