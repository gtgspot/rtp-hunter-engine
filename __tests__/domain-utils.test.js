/**
 * Tests for src/utils/domain-utils.js
 *
 * All test data uses fabricated domains with the reserved ".test" TLD (RFC 2606).
 * No real gaming domains, API endpoints, or production data are referenced.
 */

const {
  normalizeDomain,
  isIPAddress,
  getRootDomain,
  groupBy,
  sortByPriority,
  filterByPriority,
  batchDomains,
  deduplicateDomains,
  buildDomainMap,
  summarizeByCategory,
  summarizeByTier,
} = require('../src/utils/domain-utils');

const { MOCK_DOMAINS, MOCK_DOMAINS_WITH_DUPLICATES } = require('./fixtures/mock-domains');

describe('domain-utils', () => {
  describe('normalizeDomain', () => {
    it('strips http:// prefix from a mock domain', () => {
      expect(normalizeDomain('http://mock-casino.test')).toBe('mock-casino.test');
    });

    it('strips https:// prefix from a mock domain', () => {
      expect(normalizeDomain('https://mock-casino.test')).toBe('mock-casino.test');
    });

    it('strips trailing path from a mock domain', () => {
      expect(normalizeDomain('mock-casino.test/games/lobby')).toBe('mock-casino.test');
    });

    it('lowercases the domain', () => {
      expect(normalizeDomain('MOCK-CASINO.TEST')).toBe('mock-casino.test');
    });

    it('returns empty string for falsy input', () => {
      expect(normalizeDomain('')).toBe('');
      expect(normalizeDomain(null)).toBe('');
      expect(normalizeDomain(undefined)).toBe('');
    });
  });

  describe('isIPAddress', () => {
    it('recognises a valid IPv4 address', () => {
      expect(isIPAddress('192.168.1.1')).toBe(true);
    });

    it('rejects a mock domain name', () => {
      expect(isIPAddress('mock-casino.test')).toBe(false);
    });
  });

  describe('getRootDomain', () => {
    it('extracts root from a subdomain mock domain', () => {
      expect(getRootDomain('staging.mock-casino.test')).toBe('mock-casino.test');
    });

    it('returns the domain as-is when it has two labels', () => {
      expect(getRootDomain('mock-casino.test')).toBe('mock-casino.test');
    });

    it('returns an IP address as-is', () => {
      expect(getRootDomain('10.0.0.1')).toBe('10.0.0.1');
    });
  });

  describe('groupBy', () => {
    it('groups mock domains by category', () => {
      const grouped = groupBy(MOCK_DOMAINS, 'category');
      expect(grouped['test']).toHaveLength(3);
      expect(grouped['mock-operator']).toHaveLength(3);
    });

    it('groups mock domains by tier', () => {
      const grouped = groupBy(MOCK_DOMAINS, 'tier');
      expect(grouped[1]).toHaveLength(3);
      expect(grouped[2]).toHaveLength(2);
    });
  });

  describe('sortByPriority', () => {
    it('sorts mock domains ascending by priority', () => {
      const sorted = sortByPriority(MOCK_DOMAINS, 'asc');
      expect(sorted[0].priority).toBeLessThanOrEqual(sorted[sorted.length - 1].priority);
    });

    it('sorts mock domains descending by priority', () => {
      const sorted = sortByPriority(MOCK_DOMAINS, 'desc');
      expect(sorted[0].priority).toBeGreaterThanOrEqual(sorted[sorted.length - 1].priority);
    });

    it('does not mutate the original array', () => {
      const original = [...MOCK_DOMAINS];
      sortByPriority(MOCK_DOMAINS, 'asc');
      expect(MOCK_DOMAINS).toEqual(original);
    });
  });

  describe('filterByPriority', () => {
    it('filters mock domains by minimum priority', () => {
      const filtered = filterByPriority(MOCK_DOMAINS, { minPriority: 10 });
      expect(filtered.every((d) => d.priority >= 10)).toBe(true);
    });

    it('filters mock domains by maximum priority', () => {
      const filtered = filterByPriority(MOCK_DOMAINS, { maxPriority: 10 });
      expect(filtered.every((d) => d.priority <= 10)).toBe(true);
    });

    it('filters mock domains by a priority range', () => {
      const filtered = filterByPriority(MOCK_DOMAINS, { minPriority: 8, maxPriority: 20 });
      expect(filtered.every((d) => d.priority >= 8 && d.priority <= 20)).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('batchDomains', () => {
    it('splits mock domains into batches of the specified size', () => {
      const batches = batchDomains(MOCK_DOMAINS, 3);
      expect(batches[0]).toHaveLength(3);
      expect(batches.length).toBe(Math.ceil(MOCK_DOMAINS.length / 3));
    });

    it('throws for batchSize < 1', () => {
      expect(() => batchDomains(MOCK_DOMAINS, 0)).toThrow('batchSize must be at least 1');
    });
  });

  describe('deduplicateDomains', () => {
    it('removes duplicate mock domains', () => {
      const deduped = deduplicateDomains(MOCK_DOMAINS_WITH_DUPLICATES);
      expect(deduped.length).toBe(MOCK_DOMAINS.length);
    });

    it('preserves first occurrence', () => {
      const deduped = deduplicateDomains(MOCK_DOMAINS_WITH_DUPLICATES);
      expect(deduped[0].domain).toBe('mock-casino-alpha.test');
    });
  });

  describe('buildDomainMap', () => {
    it('builds a lookup map from mock domains', () => {
      const map = buildDomainMap(MOCK_DOMAINS);
      expect(map.get('mock-casino-alpha.test')).toBeDefined();
      expect(map.get('nonexistent.test')).toBeUndefined();
    });
  });

  describe('summarizeByCategory', () => {
    it('counts mock domains per category', () => {
      const summary = summarizeByCategory(MOCK_DOMAINS);
      expect(summary['test']).toBe(3);
      expect(summary['mock-operator']).toBe(3);
    });
  });

  describe('summarizeByTier', () => {
    it('counts mock domains per tier', () => {
      const summary = summarizeByTier(MOCK_DOMAINS);
      expect(summary[1]).toBe(3);
      expect(summary[2]).toBe(2);
    });
  });
});
