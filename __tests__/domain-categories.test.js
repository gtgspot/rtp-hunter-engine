/**
 * Tests for src/config/domain-categories.js
 *
 * Pattern matching is tested against fabricated mock domains using the
 * ".test" TLD (RFC 2606). These domains do not resolve and are not real
 * gaming operator endpoints.
 */

const {
  TIERS,
  CATEGORIES,
  getCategory,
  getCategoryNames,
  getCategoriesByTier,
  detectCategory,
} = require('../src/config/domain-categories');

describe('domain-categories', () => {
  describe('TIERS', () => {
    it('defines four tiers', () => {
      expect(Object.keys(TIERS)).toHaveLength(4);
    });

    it('each tier has a label and priority range', () => {
      for (const tier of Object.values(TIERS)) {
        expect(tier).toHaveProperty('label');
        expect(tier).toHaveProperty('priorityRange');
        expect(tier.priorityRange).toHaveLength(2);
      }
    });
  });

  describe('CATEGORIES', () => {
    it('each category has label, priority, tier, and pattern', () => {
      for (const cat of Object.values(CATEGORIES)) {
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('priority');
        expect(cat).toHaveProperty('tier');
        expect(cat).toHaveProperty('pattern');
        expect(cat.pattern).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('getCategory', () => {
    it('returns the category definition for a known key', () => {
      const cat = getCategory('test');
      expect(cat).toBeDefined();
      expect(cat.label).toBe('Test/Staging Environments');
    });

    it('returns null for an unknown key', () => {
      expect(getCategory('nonexistent-mock-category')).toBeNull();
    });
  });

  describe('getCategoryNames', () => {
    it('returns an array of all category keys', () => {
      const names = getCategoryNames();
      expect(names).toContain('test');
      expect(names.length).toBe(Object.keys(CATEGORIES).length);
    });
  });

  describe('getCategoriesByTier', () => {
    it('returns only tier-1 categories', () => {
      const tier1 = getCategoriesByTier(1);
      for (const cat of Object.values(tier1)) {
        expect(cat.tier).toBe(1);
      }
    });
  });

  describe('detectCategory', () => {
    it('detects the "test" category for a mock test/staging domain', () => {
      // Using a fabricated domain that matches the "test" pattern
      expect(detectCategory('test.mock-casino.test')).toBe('test');
      expect(detectCategory('dev.mock-platform.test')).toBe('test');
      expect(detectCategory('staging.mock-slot.test')).toBe('test');
    });

    it('returns "unknown" for an unrecognised mock domain', () => {
      expect(detectCategory('completely-unknown-mock.test')).toBe('unknown');
    });

    it('detects categories using pattern matching against fabricated domains', () => {
      // These domain names contain substrings that match category patterns,
      // but are fabricated and use the ".test" TLD.
      expect(detectCategory('mock-happyhappy-site.test')).toBe('happyhappy');
      expect(detectCategory('mock-bcb88-portal.test')).toBe('bcb88');
      // Note: "jili" is a game *provider* pattern (rtp-hunter), not a domain
      // *category* pattern. Domain categories are operator brands.
      expect(detectCategory('mock-ong777-site.test')).toBe('ong777');
    });
  });
});
