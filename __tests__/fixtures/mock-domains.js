/**
 * TEST FIXTURES — Mock Domains
 *
 * These are NOT real endpoints. They use the reserved ".test" TLD (RFC 2606)
 * and fabricated hostnames to ensure tests cannot be mistaken for actual
 * routing mechanics or production database seeds.
 */

const MOCK_DOMAINS = [
  { domain: 'mock-casino-alpha.test', priority: 5, tier: 1, category: 'test' },
  { domain: 'mock-casino-beta.test', priority: 10, tier: 2, category: 'mock-operator' },
  { domain: 'mock-casino-gamma.test', priority: 20, tier: 3, category: 'mock-operator' },
  { domain: 'mock-casino-delta.test', priority: 35, tier: 4, category: 'mock-highvalue' },
  { domain: 'staging.mock-slot.test', priority: 5, tier: 1, category: 'test' },
  { domain: 'fake-gaming-hub.test', priority: 15, tier: 3, category: 'mock-hub' },
  { domain: 'test-wallet.example.test', priority: 8, tier: 2, category: 'mock-operator' },
  { domain: 'dev.placeholder-casino.test', priority: 5, tier: 1, category: 'test' },
];

/**
 * Mock domain with a duplicate to test deduplication.
 */
const MOCK_DOMAINS_WITH_DUPLICATES = [
  ...MOCK_DOMAINS,
  { domain: 'mock-casino-alpha.test', priority: 5, tier: 1, category: 'test' },
];

module.exports = { MOCK_DOMAINS, MOCK_DOMAINS_WITH_DUPLICATES };
