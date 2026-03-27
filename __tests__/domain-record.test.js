/**
 * Tests for src/models/DomainRecord.js
 *
 * All test data uses fabricated mock domains with the ".test" TLD (RFC 2606).
 * No real gaming domains or production data are referenced.
 */

const DomainRecord = require('../src/models/DomainRecord');

describe('DomainRecord', () => {
  describe('constructor', () => {
    it('creates a record from valid mock data', () => {
      const record = new DomainRecord({
        domain: 'mock-casino.test',
        priority: 10,
        tier: 2,
        category: 'mock-operator',
      });

      expect(record.domain).toBe('mock-casino.test');
      expect(record.priority).toBe(10);
      expect(record.tier).toBe(2);
      expect(record.category).toBe('mock-operator');
      expect(record.status).toBe('pending');
      expect(record.findings).toEqual([]);
      expect(record.error).toBeNull();
    });

    it('throws when domain is missing', () => {
      expect(() => new DomainRecord({ priority: 5 })).toThrow(
        'DomainRecord: domain is required'
      );
    });

    it('throws when domain is empty', () => {
      expect(() => new DomainRecord({ domain: '  ', priority: 5 })).toThrow(
        'DomainRecord: domain is required'
      );
    });

    it('throws when priority is not a number', () => {
      expect(() => new DomainRecord({ domain: 'mock.test', priority: 'high' })).toThrow(
        'DomainRecord: priority must be a number'
      );
    });
  });

  describe('toJSON', () => {
    it('serializes mock record to a plain object', () => {
      const record = new DomainRecord({
        domain: 'mock-casino.test',
        priority: 10,
        tier: 2,
        category: 'mock-operator',
        findings: [{ provider: 'mock-provider', gameId: 'mock_game', rtp: 95.0 }],
      });

      const json = record.toJSON();
      expect(json.domain).toBe('mock-casino.test');
      expect(json.findings).toHaveLength(1);
      expect(json.findings[0].provider).toBe('mock-provider');
    });
  });

  describe('toSummary', () => {
    it('computes average RTP from mock findings', () => {
      const record = new DomainRecord({
        domain: 'mock-casino.test',
        priority: 10,
        tier: 2,
        category: 'mock-operator',
        findings: [
          { rtp: 96.0 },
          { rtp: 94.0 },
          { rtp: null },
        ],
      });

      const summary = record.toSummary();
      expect(summary.avgRtp).toBe(95.0);
      expect(summary.findingCount).toBe(3);
    });

    it('returns null avgRtp when no findings have RTP values', () => {
      const record = new DomainRecord({
        domain: 'mock-casino.test',
        priority: 10,
        tier: 2,
        category: 'mock-operator',
        findings: [{ rtp: null }],
      });

      expect(record.toSummary().avgRtp).toBeNull();
    });
  });

  describe('fromObject', () => {
    it('creates a DomainRecord from a plain mock object', () => {
      const record = DomainRecord.fromObject({
        domain: 'mock-casino.test',
        priority: 15,
        tier: 3,
        category: 'mock-hub',
      });

      expect(record).toBeInstanceOf(DomainRecord);
      expect(record.domain).toBe('mock-casino.test');
    });
  });
});
