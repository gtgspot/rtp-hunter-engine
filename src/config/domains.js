'use strict';

/**
 * Domain configuration module.
 * Loads the canonical domain list from config/domains.json and provides
 * helper functions for organizing, filtering, and batching domains.
 *
 * For the full category/tier metadata, see src/config/domain-categories.js.
 */

const domains = require('../../config/domains.json');

/**
 * Organizes all domains by their priority value.
 * @returns {Object} Map of priority → domain array.
 */
function organizeByPriority() {
    return domains.reduce((acc, domain) => {
        if (!acc[domain.priority]) { acc[domain.priority] = []; }
        acc[domain.priority].push(domain);
        return acc;
    }, {});
}

/**
 * Filters domains based on a predicate function.
 * @param {Function} criteria - Function receiving a domain object, returning boolean.
 * @returns {Array<Object>} Filtered domains.
 */
function filterDomains(criteria) {
    return domains.filter(criteria);
}

/**
 * Categorizes domains matching each of the provided category names.
 * @param {string[]} categories - Array of category name strings.
 * @returns {Object} Map of category name → matched domain objects.
 */
function categorizeDomains(categories) {
    const categorized = {};
    categories.forEach(category => {
        categorized[category] = domains.filter(domain => domain.category === category);
    });
    return categorized;
}

/**
 * Splits the domain list into batches of the specified size.
 * @param {number} batchSize - Number of domains per batch.
 * @returns {Array<Array<Object>>} Array of domain batches.
 */
function batchProcessDomains(batchSize) {
    const batches = [];
    for (let i = 0; i < domains.length; i += batchSize) {
        batches.push(domains.slice(i, i + batchSize));
    }
    return batches;
}

// Exporting helper functions
export { organizeByPriority, filterDomains, categorizeDomains, batchProcessDomains };
