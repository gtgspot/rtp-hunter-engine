/**
 * Tests for src/services/ResultAggregator.js
 *
 * All findings use fabricated mock providers, game IDs, and RTP values.
 * No real gaming data or production API responses are referenced.
 */

const ResultAggregator = require('../src/services/ResultAggregator');

const { MOCK_HUNT_FINDINGS } = require('./fixtures/mock-api-data');

describe('ResultAggregator', () => {
  let aggregator;

  beforeEach(() => {
    aggregator = new ResultAggregator();
  });

  describe('addResult / getResults', () => {
    it('stores a mock domain result', () => {
      aggregator.addResult('mock-casino.test', MOCK_HUNT_FINDINGS);
      const results = aggregator.getResults();
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe('mock-casino.test');
      expect(results[0].findings).toEqual(MOCK_HUNT_FINDINGS);
    });
  });

  describe('addError / getErrors', () => {
    it('stores a mock domain error', () => {
      aggregator.addError('failing-casino.test', 'Simulated mock timeout');
      const errors = aggregator.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].domain).toBe('failing-casino.test');
      expect(errors[0].error).toBe('Simulated mock timeout');
    });

    it('converts an Error object to a string', () => {
      aggregator.addError('failing-casino.test', new Error('Mock connection refused'));
      expect(aggregator.getErrors()[0].error).toBe('Mock connection refused');
    });
  });

  describe('buildReport', () => {
    it('builds a report from mock findings', () => {
      aggregator.addResult('mock-casino-alpha.test', MOCK_HUNT_FINDINGS);
      aggregator.addResult('mock-casino-beta.test', []);
      aggregator.addError('failing-casino.test', 'Simulated error');

      const report = aggregator.buildReport();

      expect(report.summary.totalDomains).toBe(2);
      expect(report.summary.totalFindings).toBe(MOCK_HUNT_FINDINGS.length);
      expect(report.summary.failedDomains).toBe(1);
      expect(report.summary.domainsWithRtp).toBeGreaterThan(0);
      expect(report.summary.averageRtp).toBeGreaterThan(0);
      expect(report.errors).toHaveLength(1);
    });

    it('includes provider statistics from mock data', () => {
      aggregator.addResult('mock-casino.test', MOCK_HUNT_FINDINGS);
      const report = aggregator.buildReport();

      expect(report.providerStats).toBeDefined();
      expect(report.providerStats['pragmatic']).toBeDefined();
      expect(report.providerStats['pragmatic'].avgRtp).toBeGreaterThan(0);
    });

    it('returns null averageRtp when no findings have RTP', () => {
      aggregator.addResult('mock-casino.test', [
        { url: 'https://mock-cdn.test/logo.png', provider: 'unknown', gameId: null, rtp: null },
      ]);
      const report = aggregator.buildReport();
      expect(report.summary.averageRtp).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears all mock data from the aggregator', () => {
      aggregator.addResult('mock-casino.test', MOCK_HUNT_FINDINGS);
      aggregator.addError('failing.test', 'Error');
      aggregator.reset();

      expect(aggregator.getResults()).toHaveLength(0);
      expect(aggregator.getErrors()).toHaveLength(0);
    });
  });
});
