'use strict';

/**
 * BulkHunterService — concurrent multi-domain RTP hunting with rate limiting.
 * Processes large domain lists in parallel while respecting concurrency and
 * rate-limit constraints, and delegates per-domain results to the caller.
 */
class BulkHunterService {
  /**
   * Creates a new BulkHunterService.
   * @param {Function} huntingFunction - Async function `(domain) => results` to call for each domain.
   * @param {Object} [options={}] - Service-level options.
   * @param {number} [options.concurrencyLimit=5] - Maximum simultaneous hunts.
   * @param {number} [options.rateLimitMs=1000] - Minimum delay (ms) between hunt starts.
   * @param {number} [options.retries=2] - Number of retry attempts on transient failure.
   * @param {number} [options.retryDelayMs=2000] - Delay (ms) before each retry.
   */
  constructor(huntingFunction, options = {}) {
    if (typeof huntingFunction !== 'function') {
      throw new Error('huntingFunction must be a function');
    }
    this.huntingFunction = huntingFunction;
    this.concurrencyLimit = options.concurrencyLimit || 5;
    this.rateLimitMs = options.rateLimitMs || 1000;
    this.retries = options.retries !== undefined ? options.retries : 2;
    this.retryDelayMs = options.retryDelayMs || 2000;
  }

  /**
   * Processes an array of domain objects (or plain domain strings) concurrently.
   * @param {Array<Object|string>} domains - Domains to process. Objects must have a `domain` property.
   * @param {Object} [options={}] - Per-call overrides for concurrencyLimit and rateLimitMs.
   * @returns {Promise<{results: Array, errors: Array, summary: Object}>} Aggregated results.
   */
  async processDomains(domains, options = {}) {
    const concurrencyLimit = options.concurrencyLimit || this.concurrencyLimit;
    const rateLimitMs = options.rateLimitMs || this.rateLimitMs;

    const progress = { total: domains.length, completed: 0, succeeded: 0, failed: 0 };
    const results = [];
    const errors = [];

    const queue = [...domains];
    const executing = new Set();
    let lastStart = 0;

    const runNext = async () => {
      if (queue.length === 0) return;
      const item = queue.shift();
      const domainName = typeof item === 'string' ? item : item.domain;
    async processDomains(domains, options = {}) {
        const { concurrencyLimit = 5, rateLimit = 1000 } = options;
        const results = [];
        const errors = [];
        const progress = {
            total: domains.length,
            completed: 0,
        };

      // Enforce rate limit
      const now = Date.now();
      const wait = Math.max(0, rateLimitMs - (now - lastStart));
      if (wait > 0) await this._sleep(wait);
      lastStart = Date.now();

      const promise = this._huntWithRetry(domainName)
        .then((result) => {
          results.push({ domain: domainName, data: result });
          progress.succeeded++;
        })
        .catch((err) => {
          errors.push({ domain: domainName, error: err.message || String(err) });
          progress.failed++;
        })
        .finally(() => {
          progress.completed++;
          this._logProgress(progress);
          executing.delete(promise);
        });

      executing.add(promise);
      if (executing.size < concurrencyLimit && queue.length > 0) {
        await runNext();
      }
    };
        // Build lazy task factories — no work starts until a slot is available
        const tasks = domains.map(domain => async () => {
            await rateLimiter();
            try {
                const result = await this.huntingFunction(domain);
                results.push(result);
            } catch (error) {
                errors.push({ domain, error });
            } finally {
                progress.completed++;
                this.logProgress(progress);
            }
        });

        await this.concurrentPool(tasks, concurrencyLimit);

    // Seed initial workers up to concurrencyLimit
    const initial = Math.min(concurrencyLimit, domains.length);
    for (let i = 0; i < initial; i++) {
      await runNext();
    }

    // Wait for all in-flight work to complete
    while (executing.size > 0) {
      await Promise.race([...executing]);
    }

    return {
      results,
      errors,
      summary: {
        total: progress.total,
        succeeded: progress.succeeded,
        failed: progress.failed,
        successRate: progress.total > 0
          ? ((progress.succeeded / progress.total) * 100).toFixed(2) + '%'
          : '0%',
      },
    };
  }

  /**
   * Hunts a single domain with automatic retry on failure.
   * @param {string} domain - The domain hostname to hunt.
   * @returns {Promise<*>} The hunting result.
   * @throws {Error} After all retry attempts are exhausted.
   */
  async _huntWithRetry(domain) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.huntingFunction(domain);
      } catch (err) {
        lastError = err;
        if (attempt < this.retries) {
          await this._sleep(this.retryDelayMs);
        }
      }
    createRateLimiter(rateLimit) {
        let lastExecution = 0;
        return async () => {
            const now = Date.now();
            const waitTime = Math.max(rateLimit - (now - lastExecution), 0);
            lastExecution = now + waitTime;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        };
    }

    async concurrentPool(tasks, limit) {
        let index = 0;

        const runNext = async () => {
            if (index >= tasks.length) return;
            const task = tasks[index++];
            await task();
            await runNext();
        };

        const workers = Array.from({ length: Math.min(limit, tasks.length) }, runNext);
        await Promise.all(workers);
    }
    throw lastError;
  }

  /**
   * Logs current processing progress to stdout.
   * @param {Object} progress - Progress object with total and completed counts.
   */
  _logProgress(progress) {
    const pct = ((progress.completed / progress.total) * 100).toFixed(1);
    console.log(
      `[BulkHunter] ${progress.completed}/${progress.total} (${pct}%) — ` +
      `✓ ${progress.succeeded} ✗ ${progress.failed}`
    );
  }

  /**
   * Returns a promise that resolves after the specified number of milliseconds.
   * @param {number} ms - Milliseconds to wait.
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default BulkHunterService;
