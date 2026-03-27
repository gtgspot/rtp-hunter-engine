# Architecture

## Overview

The **rtp-hunter-engine** is a Node.js service that discovers gaming providers, extracts game IDs, and resolves RTP (Return to Player) percentages across a network of 400+ gaming domains. The system is built for horizontal scalability, priority-based domain stratification, and extensible persistence.

---

## Repository Structure

```
rtp-hunter-engine/
├── config/
│   └── domains.json              # Canonical domain list (400+ entries with priority/tier/category)
├── scripts/
│   └── migrate-domains.js        # Converts legacy PHP array format to domains.json
├── src/
│   ├── adapters/
│   │   └── DatabaseAdapter.js    # Abstract database interface (in-memory by default)
│   ├── config/
│   │   ├── domain-categories.js  # Category & tier definitions, pattern matchers
│   │   └── domains.js            # Loads domains.json + backward-compatible helpers
│   ├── managers/
│   │   └── DomainManager.js      # Domain lifecycle management (CRUD, grouping, filtering)
│   ├── migrations/
│   │   └── setup-db.js           # Seeds DatabaseAdapter from domains.json
│   ├── models/
│   │   └── DomainRecord.js       # Domain result data model with validation & serialization
│   ├── routes/
│   │   ├── domainRoutes.js       # REST API for domain queries
│   │   └── huntingRoutes.js      # REST API for bulk hunting operations
│   ├── services/
│   │   ├── BulkHunterService.js  # Concurrent multi-domain hunting with rate limiting
│   │   ├── QueueManager.js       # In-memory job queue with priority and retry
│   │   └── ResultAggregator.js   # Aggregates findings into structured reports
│   └── utils/
│       └── domain-utils.js       # Pure utility functions (normalize, sort, batch, dedupe)
├── rtp-hunter.js                 # Core RTP hunter (Playwright-based, ES module)
├── SpinSimulationEngine.js       # Spin simulation & empirical RTP calculation
├── server.js                     # Express HTTP server with all API endpoints
├── ARCHITECTURE.md               # This file
└── MIGRATION.md                  # Migration guide from legacy code
```

---

## Domain Priority Tiers

| Tier | Priority Range | Description |
|------|---------------|-------------|
| 1 | 5 | Test/Staging environments |
| 2 | 6–14 | Secondary operators (happyhappy, bcb88, juta9) |
| 3 | 15–31 | Primary operators (kkforu, 100judi, ong777, 9kiss, jomcuci918) |
| 4 | 32–50 | High-value production (mari888, gdl88, bbwin33, matbet88, 1play, u2w) |

---

## Domain Categories

| Category | Priority | Description |
|----------|----------|-------------|
| test | 5 | Dev/staging domains |
| happyhappy | 6 | HappyHappy88 operator network |
| bcb88 | 9 | BCB88 operator network |
| juta9 | 10 | Juta9/Jutabet operator network |
| kkforu | 15 | KKForu/KKOnlineBet operator |
| 100judi | 18 | 100Judi operator |
| ong777 | 21 | Ong777 operator |
| 9kiss | 23 | 9Kiss/918Kiss operator |
| lgd88 | 24–26 | LGD88 operator |
| jomcuci918 | 29 | JomCuci918 operator |
| mari888 | 32 | Mari888 operator |
| gdl88 | 35 | GDL88 operator |
| bbwin33 | 37 | BBWin33 operator |
| okwin333 | 38 | OKWin333 operator |
| 13pokies | 39 | 13Pokies operator |
| ttb88 | 40 | TTB88/TipTopBet88 operator |
| securerabbit | 41 | SecureRabbit operator |
| ikaya28 | 42 | iKaya28 operator |
| matbet88 | 43 | MatBet88 operator |
| 1play | 45 | 1Play/OnePlaySG operator |
| gwin7 | 47 | GWin7 operator |
| u2w | 48 | U2Wallet operator |

---

## API Endpoints

### Domain Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/domains` | List all domains (supports `?category=`, `?tier=`, `?minPriority=`, `?maxPriority=`) |
| GET | `/domains/summary` | Statistical summary: total, by tier, by category |
| GET | `/domains/category/:category` | All domains in a specific category |
| GET | `/domains/tier/:tier` | All domains in a specific tier |
| GET | `/domains/:domain` | Metadata for a single domain |

### Hunting Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hunt/:domain` | Hunt RTP data for a single domain |
| POST | `/hunt/bulk` | Bulk hunt (by domain list, category, tier, or priority range) |
| GET | `/report` | Domain configuration summary report |
| GET | `/health` | Health check |

#### POST `/hunt/bulk` Request Body

```json
{
  "category": "matbet88",
  "options": {
    "concurrencyLimit": 3,
    "rateLimitMs": 1000,
    "retries": 2
  }
}
```

Or with explicit domain list:

```json
{
  "domains": ["matbet88.com", "matbet88.live"],
  "options": { "concurrencyLimit": 2 }
}
```

Or by priority range:

```json
{
  "minPriority": 40,
  "maxPriority": 48
}
```

---

## Key Design Patterns

### Layered Architecture

```
Routes → Services → Managers/Adapters → Core Modules
```

- **Routes** handle HTTP concerns (parsing, validation, response shaping).
- **Services** implement business logic (bulk processing, queue management, result aggregation).
- **Managers** provide domain lifecycle management (CRUD, grouping, filtering).
- **Adapters** abstract persistence (swap in-memory for MongoDB/PostgreSQL without changing service code).
- **Core Modules** (`rtp-hunter.js`, `SpinSimulationEngine.js`) remain unchanged.

### Priority-Based Stratification

`DomainManager.getStratifiedBatches(n)` sorts domains by descending priority before batching, ensuring high-value production domains (tier 4) are processed before test environments (tier 1).

### Concurrency Control

`BulkHunterService` limits concurrent Playwright browser instances via `concurrencyLimit` and enforces minimum inter-request delays via `rateLimitMs` to avoid overwhelming target servers.

### Extensibility

To add a new operator:
1. Add domain entries to `config/domains.json`.
2. Add a category definition to `src/config/domain-categories.js`.
3. No other files need to change.
