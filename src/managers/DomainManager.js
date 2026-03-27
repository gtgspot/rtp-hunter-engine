'use strict';

const domainsData = require('../../config/domains.json');
const {
  groupBy,
  sortByPriority,
  filterByPriority,
  batchDomains,
  deduplicateDomains,
  buildDomainMap,
  summarizeByCategory,
  summarizeByTier,
} = require('../utils/domain-utils');
const { TIERS, CATEGORIES, detectCategory } = require('../config/domain-categories');

/**
 * Manages the full lifecycle of gaming domains for the RTP Hunter Engine.
 * Provides grouping, filtering, priority stratification, and metadata access.
 */
class DomainManager {
  /**
   * Creates a new DomainManager instance.
   * @param {Array<Object>} [domains] - Optional custom domain list. Defaults to config/domains.json.
   */
  constructor(domains = domainsData) {
    this._domains = deduplicateDomains(domains);
    this._domainMap = buildDomainMap(this._domains);
  }

  /**
   * Returns the full list of domains.
   * @returns {Array<Object>} All domain objects.
   */
  getAll() {
    return this._domains;
  }

  /**
   * Returns a single domain object by its hostname.
   * @param {string} domain - The domain hostname to look up.
   * @returns {Object|null} The domain object, or null if not found.
   */
  getByDomain(domain) {
    return this._domainMap.get(domain) || null;
  }

  /**
   * Returns all domains belonging to a given category.
   * @param {string} category - Category name (e.g. 'happyhappy', 'bcb88').
   * @returns {Array<Object>} Domains in the specified category.
   */
  getByCategory(category) {
    return this._domains.filter((d) => d.category === category);
  }

  /**
   * Returns all domains belonging to a given tier.
   * @param {number} tier - Tier number (1–4).
   * @returns {Array<Object>} Domains in the specified tier.
   */
  getByTier(tier) {
    return this._domains.filter((d) => d.tier === tier);
  }

  /**
   * Returns all domains with the exact priority value.
   * @param {number} priority - The priority value.
   * @returns {Array<Object>} Domains with that priority.
   */
  getByPriority(priority) {
    return this._domains.filter((d) => d.priority === priority);
  }

  /**
   * Returns domains filtered by a priority range.
   * @param {number} [minPriority] - Minimum priority (inclusive).
   * @param {number} [maxPriority] - Maximum priority (inclusive).
   * @returns {Array<Object>} Filtered domain objects.
   */
  filterByPriorityRange(minPriority, maxPriority) {
    return filterByPriority(this._domains, { minPriority, maxPriority });
  }

  /**
   * Returns domains grouped by priority value.
   * @returns {Object} Map of priority → domain array.
   */
  groupByPriority() {
    return groupBy(this._domains, 'priority');
  }

  /**
   * Returns domains grouped by category.
   * @returns {Object} Map of category name → domain array.
   */
  groupByCategory() {
    return groupBy(this._domains, 'category');
  }

  /**
   * Returns domains grouped by tier.
   * @returns {Object} Map of tier number → domain array.
   */
  groupByTier() {
    return groupBy(this._domains, 'tier');
  }

  /**
   * Returns all domains sorted by priority.
   * @param {string} [order='asc'] - Sort order: 'asc' or 'desc'.
   * @returns {Array<Object>} Sorted domain objects.
   */
  sortedByPriority(order = 'asc') {
    return sortByPriority(this._domains, order);
  }

  /**
   * Splits all domains into batches of the specified size.
   * @param {number} batchSize - Number of domains per batch.
   * @returns {Array<Array<Object>>} Array of domain batches.
   */
  getBatches(batchSize) {
    return batchDomains(this._domains, batchSize);
  }

  /**
   * Returns priority-stratified batches: higher-priority domains first.
   * @param {number} batchSize - Number of domains per batch.
   * @returns {Array<Array<Object>>} Stratified domain batches (high priority first).
   */
  getStratifiedBatches(batchSize) {
    const sorted = sortByPriority(this._domains, 'desc');
    return batchDomains(sorted, batchSize);
  }

  /**
   * Returns a statistical summary of the domain list.
   * @returns {Object} Summary with total, tier breakdown, and category breakdown.
   */
  getSummary() {
    return {
      total: this._domains.length,
      byTier: summarizeByTier(this._domains),
      byCategory: summarizeByCategory(this._domains),
      tiers: TIERS,
      categories: Object.fromEntries(
        Object.entries(CATEGORIES).map(([k, v]) => [
          k,
          { label: v.label, priority: v.priority, tier: v.tier, description: v.description },
        ])
      ),
    };
  }

  /**
   * Adds a new domain entry to the manager.
   * @param {string} domain - The domain hostname.
   * @param {number} priority - Priority value.
   * @param {string} category - Category name.
   * @param {number} tier - Tier number.
   * @returns {Object} The newly added domain object.
   * @throws {Error} If the domain already exists.
   */
  addDomain(domain, priority, category, tier) {
    if (this._domainMap.has(domain)) {
      throw new Error(`Domain already exists: ${domain}`);
    getDomains() {
        if (this._dirty) {
            this.organizeDomains();
        }
        return this.domains;
    }
    const detectedCategory = category || detectCategory(domain);
    const entry = { domain, priority, tier: tier || 1, category: detectedCategory };
    this._domains.push(entry);
    this._domainMap.set(domain, entry);
    return entry;
  }

  /**
   * Removes a domain entry from the manager.
   * @param {string} domain - The domain hostname to remove.
   * @returns {boolean} True if removed, false if not found.
   */
  removeDomain(domain) {
    const index = this._domains.findIndex((d) => d.domain === domain);
    if (index === -1) return false;
    this._domains.splice(index, 1);
    this._domainMap.delete(domain);
    return true;
  }

  /**
   * Filters domains using a custom predicate function.
   * @param {Function} predicate - Function receiving a domain object and returning boolean.
   * @returns {Array<Object>} Filtered domain objects.
   */
  filter(predicate) {
    return this._domains.filter(predicate);
  }
}

module.exports = DomainManager;
export { Domain, DomainManager };
