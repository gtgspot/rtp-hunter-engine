// domains.js

// Domain configuration data
const domains = [
    { name: 'example1.com', priority: 1 },
    { name: 'example2.com', priority: 2 },
    { name: 'example3.com', priority: 1 },
    { name: 'example4.com', priority: 3 },
];

/**
 * Organizes the provided domain array by priority levels.
 * @returns {Object} Organized domains by priority.
 */
function organizeByPriority() {
    return domains.reduce((acc, domain) => {
        if (!acc[domain.priority]) { acc[domain.priority] = []; }
        acc[domain.priority].push(domain);
        return acc;
    }, {});
}

/**
 * Filters domains based on given criteria.
 * @param {Function} criteria - Function to test each domain.
 * @returns {Array} Filtered domains.
 */
function filterDomains(criteria) {
    return domains.filter(criteria);
}

/**
 * Categorizes domains into different buckets.
 * @param {Array} categories - Array of categories to use for categorization.
 * @returns {Object} Categorized domains.
 */
function categorizeDomains(categories) {
    const categorized = {};
    categories.forEach(category => {
        categorized[category] = domains.filter(domain => domain.name.includes(category));
    });
    return categorized;
}

/**
 * Processes domains in batches.
 * @param {number} batchSize - Size of each batch.
 * @returns {Array} Processed batch of domains.
 */
function batchProcessDomains(batchSize) {
    const batches = [];
    for (let i = 0; i < domains.length; i += batchSize) {
        batches.push(domains.slice(i, i + batchSize));
    }
    return batches;
}

// Exporting helper functions
module.exports = {
    organizeByPriority,
    filterDomains,
    categorizeDomains,
    batchProcessDomains,
};
