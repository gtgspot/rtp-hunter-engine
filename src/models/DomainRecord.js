'use strict';

/**
 * DomainRecord — data model representing a domain and its associated hunt results.
 * Used to validate, structure, and serialize domain hunt data for storage or API responses.
 */
class DomainRecord {
  /**
   * Creates a new DomainRecord.
   * @param {Object} data - Record data.
   * @param {string} data.domain - Domain hostname (required).
   * @param {number} data.priority - Domain priority value.
   * @param {number} data.tier - Domain tier (1–4).
   * @param {string} data.category - Operator category name.
   * @param {Array<Object>} [data.findings=[]] - Hunt findings from huntRTP.
   * @param {string} [data.status='pending'] - Record status: 'pending' | 'active' | 'completed' | 'failed'.
   * @param {string} [data.lastHuntedAt] - ISO timestamp of last successful hunt.
   * @param {string|null} [data.error] - Last error message if status is 'failed'.
   */
  constructor(data) {
    DomainRecord._validate(data);
    this.domain = data.domain;
    this.priority = data.priority;
    this.tier = data.tier;
    this.category = data.category;
    this.findings = Array.isArray(data.findings) ? data.findings : [];
    this.status = data.status || 'pending';
    this.lastHuntedAt = data.lastHuntedAt || null;
    this.error = data.error || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validates that required fields are present and well-typed.
   * @param {Object} data
   * @throws {Error} If validation fails.
   */
  static _validate(data) {
    if (!data || typeof data.domain !== 'string' || !data.domain.trim()) {
      throw new Error('DomainRecord: domain is required and must be a non-empty string');
    }
    if (typeof data.priority !== 'number') {
      throw new Error('DomainRecord: priority must be a number');
    }
  }

  /**
   * Returns a plain object representation suitable for JSON serialization.
   * @returns {Object}
   */
  toJSON() {
    return {
      domain: this.domain,
      priority: this.priority,
      tier: this.tier,
      category: this.category,
      findings: this.findings,
      status: this.status,
      lastHuntedAt: this.lastHuntedAt,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Returns a summary with just identity and key metrics.
   * @returns {Object}
   */
  toSummary() {
    const rtpValues = this.findings
      .map((f) => f.rtp)
      .filter((v) => v !== null && v !== undefined);
    const avgRtp =
      rtpValues.length > 0
        ? parseFloat((rtpValues.reduce((s, v) => s + v, 0) / rtpValues.length).toFixed(2))
        : null;
    return {
      domain: this.domain,
      priority: this.priority,
      category: this.category,
      status: this.status,
      findingCount: this.findings.length,
      avgRtp,
      lastHuntedAt: this.lastHuntedAt,
    };
  }

  /**
   * Creates a DomainRecord from a plain object (e.g. from the database).
   * @param {Object} obj - Plain record object.
   * @returns {DomainRecord}
   */
  static fromObject(obj) {
    return new DomainRecord(obj);
  }
}

module.exports = DomainRecord;
