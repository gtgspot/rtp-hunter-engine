'use strict';

/**
 * DatabaseAdapter — abstract interface for persisting domain records.
 *
 * This adapter uses an in-memory store by default.
 * Replace _store with a real database (MongoDB, PostgreSQL, SQLite, etc.)
 * by overriding or subclassing the read/write methods.
 */
class DatabaseAdapter {
  /**
   * Creates a new DatabaseAdapter.
   * @param {Object} [options={}] - Adapter options.
   * @param {Object} [options.store] - Optional pre-existing in-memory store Map.
   */
  constructor(options = {}) {
    /** @type {Map<string, Object>} In-memory domain record store. */
    this._store = options.store || new Map();
    this._connected = false;
  }

  /**
   * Opens the database connection (no-op for the in-memory implementation).
   * @returns {Promise<void>}
   */
  async connect() {
    this._connected = true;
  }

  /**
   * Closes the database connection (no-op for the in-memory implementation).
   * @returns {Promise<void>}
   */
  async disconnect() {
    this._connected = false;
  }

  /**
   * Saves or updates a domain record.
   * @param {string} domain - The domain hostname (primary key).
   * @param {Object} data - Record data to persist.
   * @returns {Promise<Object>} The saved record with an `updatedAt` timestamp.
   */
  async upsert(domain, data) {
    const record = {
      ...data,
      domain,
      updatedAt: new Date().toISOString(),
      createdAt: this._store.has(domain)
        ? this._store.get(domain).createdAt
        : new Date().toISOString(),
    };
    this._store.set(domain, record);
    return record;
  }

  /**
   * Retrieves a domain record by hostname.
   * @param {string} domain - The domain hostname.
   * @returns {Promise<Object|null>} The record, or null if not found.
   */
  async findByDomain(domain) {
    return this._store.get(domain) || null;
  }

  /**
   * Retrieves all records with a priority greater than or equal to minPriority.
   * @param {number} minPriority - Minimum priority threshold.
   * @returns {Promise<Array<Object>>} Matching records.
   */
  async findByMinPriority(minPriority) {
    return [...this._store.values()].filter(
      (r) => r.priority !== undefined && r.priority >= minPriority
    );
  }

  /**
   * Retrieves all records belonging to a given category.
   * @param {string} category - Category name.
   * @returns {Promise<Array<Object>>} Matching records.
   */
  async findByCategory(category) {
    return [...this._store.values()].filter((r) => r.category === category);
  }

  /**
   * Returns all stored records.
   * @returns {Promise<Array<Object>>} All records.
   */
  async findAll() {
    return [...this._store.values()];
  }

  /**
   * Deletes a domain record by hostname.
   * @param {string} domain - The domain hostname.
   * @returns {Promise<boolean>} True if deleted, false if not found.
   */
  async delete(domain) {
    return this._store.delete(domain);
  }

  /**
   * Returns the total number of stored records.
   * @returns {Promise<number>}
   */
  async count() {
    return this._store.size;
  }

  /**
   * Removes all records from the store.
   * @returns {Promise<void>}
   */
  async clear() {
    this._store.clear();
  }
}

module.exports = DatabaseAdapter;
