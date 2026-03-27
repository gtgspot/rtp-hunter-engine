'use strict';

/**
 * QueueManager — in-memory job queue for reliable batch domain processing.
 * Supports job priorities, status tracking, retry handling, and callbacks.
 */
class QueueManager {
  /**
   * Creates a new QueueManager.
   * @param {Object} [options={}] - Configuration options.
   * @param {number} [options.concurrency=3] - Maximum concurrent jobs.
   * @param {number} [options.maxRetries=3] - Maximum retry attempts per job.
   * @param {number} [options.retryDelayMs=1000] - Delay (ms) between retries.
   */
  constructor(options = {}) {
    this.concurrency = options.concurrency || 3;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.retryDelayMs = options.retryDelayMs || 1000;

    this._queue = [];
    this._activeJobs = new Map();
    this._completedJobs = [];
    this._failedJobs = [];
    this._nextId = 1;
    this._running = false;
  }

  /**
   * Adds a new job to the queue.
   * @param {string} domain - Domain name for this job.
   * @param {Function} task - Async function `() => result` to execute.
   * @param {Object} [options={}] - Per-job options.
   * @param {number} [options.priority=0] - Higher number = higher priority.
   * @returns {string} The assigned job ID.
   */
  enqueue(domain, task, options = {}) {
    const job = {
      id: String(this._nextId++),
      domain,
      task,
      priority: options.priority || 0,
      retries: 0,
      status: 'queued',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };
    this._queue.push(job);
    this._queue.sort((a, b) => b.priority - a.priority);
    return job.id;
  }

  /**
   * Starts the queue processor. Continues until the queue is drained.
   * @param {Function} [onJobComplete] - Optional callback `(job)` invoked on each completion or failure.
   * @returns {Promise<void>} Resolves when all queued jobs are finished.
   */
  async start(onJobComplete) {
    if (this._running) return;
    this._running = true;
    await this._drain(onJobComplete);
    this._running = false;
  }

  /**
   * Internal drain loop — processes jobs up to concurrency limit.
   * @param {Function} [onJobComplete]
   */
  async _drain(onJobComplete) {
    while (this._queue.length > 0 || this._activeJobs.size > 0) {
      while (this._queue.length > 0 && this._activeJobs.size < this.concurrency) {
        const job = this._queue.shift();
        this._runJob(job, onJobComplete);
      }
      if (this._activeJobs.size > 0) {
        await Promise.race([...this._activeJobs.values()]);
      }
    }
  }

  /**
   * Executes a single job with retry logic.
   * @param {Object} job - The job to run.
   * @param {Function} [onJobComplete]
   */
  _runJob(job, onJobComplete) {
    job.status = 'active';
    job.startedAt = new Date().toISOString();

    const promise = this._attemptJob(job)
      .then((result) => {
        job.result = result;
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        this._completedJobs.push(job);
        if (typeof onJobComplete === 'function') onJobComplete(job);
      })
      .catch((err) => {
        if (job.retries < this.maxRetries) {
          job.retries++;
          job.status = 'queued';
          // Re-queue with delay via a deferred insertion
          setTimeout(() => {
            this._queue.unshift(job);
            this._queue.sort((a, b) => b.priority - a.priority);
          }, this.retryDelayMs);
        } else {
          job.error = err.message || String(err);
          job.status = 'failed';
          job.completedAt = new Date().toISOString();
          this._failedJobs.push(job);
          if (typeof onJobComplete === 'function') onJobComplete(job);
        }
      })
      .finally(() => {
        this._activeJobs.delete(job.id);
      });

    this._activeJobs.set(job.id, promise);
  }

  /**
   * Runs the task for a job and returns the result.
   * @param {Object} job
   * @returns {Promise<*>}
   */
  async _attemptJob(job) {
    return job.task();
  }

  /**
   * Returns queue statistics.
   * @returns {Object} Current stats including queue length and job counts.
   */
  getStats() {
    return {
      queued: this._queue.length,
      active: this._activeJobs.size,
      completed: this._completedJobs.length,
      failed: this._failedJobs.length,
      total: this._queue.length + this._activeJobs.size + this._completedJobs.length + this._failedJobs.length,
    };
  }

  /**
   * Returns all completed job records.
   * @returns {Array<Object>}
   */
  getCompletedJobs() {
    return this._completedJobs;
  }

  /**
   * Returns all failed job records.
   * @returns {Array<Object>}
   */
  getFailedJobs() {
    return this._failedJobs;
  }

  /**
   * Clears all completed and failed job history.
   */
  clearHistory() {
    this._completedJobs = [];
    this._failedJobs = [];
  }
}

module.exports = QueueManager;
