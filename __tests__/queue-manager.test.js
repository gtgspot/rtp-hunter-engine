/**
 * Tests for src/services/QueueManager.js
 *
 * All tasks use mock async functions that resolve or reject with
 * fabricated data. No real API calls, domain hunts, or database
 * operations are performed.
 */

const QueueManager = require('../src/services/QueueManager');

describe('QueueManager', () => {
  let queue;

  beforeEach(() => {
    queue = new QueueManager({ concurrency: 2, maxRetries: 1, retryDelayMs: 10 });
  });

  describe('enqueue', () => {
    it('adds a mock job and returns an ID', () => {
      const id = queue.enqueue('mock-casino.test', async () => 'mock-result');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('prioritises higher-priority mock jobs', () => {
      queue.enqueue('low.test', async () => {}, { priority: 1 });
      queue.enqueue('high.test', async () => {}, { priority: 10 });
      queue.enqueue('mid.test', async () => {}, { priority: 5 });

      // Internal queue should be ordered by priority descending
      expect(queue._queue[0].domain).toBe('high.test');
      expect(queue._queue[1].domain).toBe('mid.test');
      expect(queue._queue[2].domain).toBe('low.test');
    });
  });

  describe('start / processing', () => {
    it('processes all mock jobs to completion', async () => {
      const results = [];
      queue.enqueue('alpha.test', async () => {
        results.push('alpha');
        return 'alpha-result';
      });
      queue.enqueue('beta.test', async () => {
        results.push('beta');
        return 'beta-result';
      });

      await queue.start();

      expect(results).toContain('alpha');
      expect(results).toContain('beta');

      const stats = queue.getStats();
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(0);
    });

    it('marks a mock job as failed after exhausting retries', async () => {
      // Use maxRetries=0 to avoid setTimeout-based retry scheduling,
      // which can cause race conditions in tests.
      const noRetryQueue = new QueueManager({ concurrency: 2, maxRetries: 0, retryDelayMs: 10 });
      noRetryQueue.enqueue('flaky.test', async () => {
        throw new Error('Simulated mock failure');
      });

      await noRetryQueue.start();

      const stats = noRetryQueue.getStats();
      expect(stats.failed).toBe(1);

      const failedJobs = noRetryQueue.getFailedJobs();
      expect(failedJobs[0].domain).toBe('flaky.test');
      expect(failedJobs[0].error).toBe('Simulated mock failure');
    });

    it('invokes onJobComplete callback for each mock job', async () => {
      const completedJobs = [];
      queue.enqueue('alpha.test', async () => 'done');

      await queue.start((job) => {
        completedJobs.push(job);
      });

      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].domain).toBe('alpha.test');
    });
  });

  describe('getStats', () => {
    it('reports initial empty stats', () => {
      const stats = queue.getStats();
      expect(stats.queued).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('clearHistory', () => {
    it('clears completed and failed mock job history', async () => {
      queue.enqueue('alpha.test', async () => 'done');
      queue.enqueue('failing.test', async () => {
        throw new Error('Simulated failure');
      });

      await queue.start();
      queue.clearHistory();

      expect(queue.getCompletedJobs()).toHaveLength(0);
      expect(queue.getFailedJobs()).toHaveLength(0);
    });
  });
});
