/**
 * Utility functions for domain operations in the RTP Hunter Engine.
 */

'use strict';

/**
 * Normalizes a domain string by stripping protocol prefix and trailing slashes.
 * @param {string} domain - Raw domain string (may include http/https).
 * @returns {string} Normalized domain hostname.
 */
function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') return '';
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

/**
 * Checks whether a string is a valid IPv4 address.
 * @param {string} value - The string to test.
 * @returns {boolean} True if the string is a valid IPv4 address.
 */
function isIPAddress(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

/**
 * Extracts the root domain (eTLD+1) from a fully qualified domain name.
 * Handles subdomains by returning only the last two labels (or one for IPs).
 * @param {string} domain - The domain name.
 * @returns {string} The root domain.
 */
function getRootDomain(domain) {
  if (isIPAddress(domain)) return domain;
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join('.');
}

/**
 * Groups an array of domain objects by a specified key.
 * @param {Array<Object>} domains - Array of domain objects.
 * @param {string} key - The key to group by (e.g. 'priority', 'category', 'tier').
 * @returns {Object} An object mapping each key value to an array of domain objects.
 */
function groupBy(domains, key) {
  return domains.reduce((acc, domain) => {
    const value = domain[key];
    if (!acc[value]) acc[value] = [];
    acc[value].push(domain);
    return acc;
  }, {});
}

/**
 * Sorts an array of domain objects by priority (ascending by default).
 * @param {Array<Object>} domains - Array of domain objects.
 * @param {string} [order='asc'] - Sort order: 'asc' or 'desc'.
 * @returns {Array<Object>} Sorted array of domain objects.
 */
function sortByPriority(domains, order = 'asc') {
  return [...domains].sort((a, b) =>
    order === 'asc' ? a.priority - b.priority : b.priority - a.priority
  );
}

/**
 * Filters domain objects by minimum and/or maximum priority.
 * @param {Array<Object>} domains - Array of domain objects.
 * @param {Object} [options={}] - Filter options.
 * @param {number} [options.minPriority] - Minimum priority (inclusive).
 * @param {number} [options.maxPriority] - Maximum priority (inclusive).
 * @returns {Array<Object>} Filtered array of domain objects.
 */
function filterByPriority(domains, { minPriority, maxPriority } = {}) {
  return domains.filter((d) => {
    if (minPriority !== undefined && d.priority < minPriority) return false;
    if (maxPriority !== undefined && d.priority > maxPriority) return false;
    return true;
  });
}

/**
 * Splits an array of domain objects into chunks of the given size.
 * @param {Array<Object>} domains - Array of domain objects.
 * @param {number} batchSize - Number of items per batch.
 * @returns {Array<Array<Object>>} Array of batches.
 */
function batchDomains(domains, batchSize) {
  if (batchSize < 1) throw new Error('batchSize must be at least 1');
  const batches = [];
  for (let i = 0; i < domains.length; i += batchSize) {
    batches.push(domains.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Deduplicates a domain array by the 'domain' field.
 * @param {Array<Object>} domains - Array of domain objects.
 * @returns {Array<Object>} Deduplicated array preserving first occurrence.
 */
function deduplicateDomains(domains) {
  const seen = new Set();
  return domains.filter((d) => {
    if (seen.has(d.domain)) return false;
    seen.add(d.domain);
    return true;
  });
}

/**
 * Builds a lookup map from domain name to domain object for O(1) access.
 * @param {Array<Object>} domains - Array of domain objects.
 * @returns {Map<string, Object>} Domain lookup map.
 */
function buildDomainMap(domains) {
  return new Map(domains.map((d) => [d.domain, d]));
}

/**
 * Returns a summary of domain counts grouped by category.
 * @param {Array<Object>} domains - Array of domain objects.
 * @returns {Object} Map of category name to count.
 */
function summarizeByCategory(domains) {
  return domains.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Returns a summary of domain counts grouped by tier.
 * @param {Array<Object>} domains - Array of domain objects.
 * @returns {Object} Map of tier number to count.
 */
function summarizeByTier(domains) {
  return domains.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});
}

module.exports = {
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
};
