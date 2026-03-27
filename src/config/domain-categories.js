/**
 * Domain category definitions and mappings for the RTP Hunter Engine.
 * Each category groups related gaming domains by operator brand.
 */

'use strict';

/**
 * Priority tier definitions.
 * Maps tier numbers to descriptive labels and priority ranges.
 */
const TIERS = {
  1: { label: 'Test/Staging', priorityRange: [5, 5], description: 'Development and staging environments' },
  2: { label: 'Secondary Operators', priorityRange: [6, 14], description: 'Secondary and mid-tier gaming operators' },
  3: { label: 'Primary Operators', priorityRange: [15, 31], description: 'Primary production gaming operators' },
  4: { label: 'High-Value Production', priorityRange: [32, 50], description: 'High-value production domains' },
};

/**
 * Category definitions with metadata for each operator brand.
 * Each entry describes a group of domains sharing a common brand or operator.
 */
const CATEGORIES = {
  test: {
    label: 'Test/Staging Environments',
    priority: 5,
    tier: 1,
    pattern: /^(test|dev|staging|api\.meiq)/i,
    description: 'Non-production environments used for development and QA',
  },
  happyhappy: {
    label: 'HappyHappy88 Operator',
    priority: 6,
    tier: 2,
    pattern: /happyhappy|happy88|5800099|9900058|5889h001|hhkiosk/i,
    description: 'HappyHappy88 gaming operator network',
  },
  bcb88: {
    label: 'BCB88 Operator',
    priority: 9,
    tier: 2,
    pattern: /bcb88|walletbcb88|mybcb88/i,
    description: 'BCB88 gaming operator network',
  },
  juta9: {
    label: 'Juta9/Jutabet Operator',
    priority: 10,
    tier: 2,
    pattern: /juta9|jutabet|mbo333/i,
    description: 'Juta9 and Jutabet gaming operator network',
  },
  kkforu: {
    label: 'KKForu/KKOnlineBet Operator',
    priority: 15,
    tier: 3,
    pattern: /kkforu|kkonlinebet|msgbb99/i,
    description: 'KKForu and KKOnlineBet gaming operator network',
  },
  '100judi': {
    label: '100Judi Operator',
    priority: 18,
    tier: 3,
    pattern: /100judi|100zudi/i,
    description: '100Judi gaming operator network',
  },
  ong777: {
    label: 'Ong777 Operator',
    priority: 21,
    tier: 3,
    pattern: /ong777|\dong777/i,
    description: 'Ong777 gaming operator network',
  },
  '9kiss': {
    label: '9Kiss/918Kiss Operator',
    priority: 23,
    tier: 3,
    pattern: /9kiss|9kme|9kmy|9ktop|9kup|9kbnd|918kisscompany|bossku96|8055win|17168online|30myr|30bnd|9kissbn|ezbet|ezbetapp|ezgo|ez-bet/i,
    description: '9Kiss and 918Kiss gaming operator network',
  },
  lgd88: {
    label: 'LGD88 Operator',
    priority: 24,
    tier: 3,
    pattern: /lgd88online/i,
    description: 'LGD88 gaming operator network',
  },
  jomcuci918: {
    label: 'JomCuci918 Operator',
    priority: 29,
    tier: 3,
    pattern: /jomcuci918|jc333|jc666|jc888|jomwasap|jomfree|companytrusted|jm918|jccbet|365ong|jcc918/i,
    description: 'JomCuci918 gaming operator network',
  },
  mari888: {
    label: 'Mari888 Operator',
    priority: 32,
    tier: 4,
    pattern: /mari888|mari666/i,
    description: 'Mari888 gaming operator network',
  },
  gdl88: {
    label: 'GDL88 Operator',
    priority: 35,
    tier: 4,
    pattern: /gdl88|gdl1|123judi/i,
    description: 'GDL88 gaming operator network',
  },
  bbwin33: {
    label: 'BBWin33 Operator',
    priority: 37,
    tier: 4,
    pattern: /bbwin33/i,
    description: 'BBWin33 gaming operator network',
  },
  okwin333: {
    label: 'OKWin333 Operator',
    priority: 38,
    tier: 4,
    pattern: /okwin333/i,
    description: 'OKWin333 gaming operator network',
  },
  '13pokies': {
    label: '13Pokies Operator',
    priority: 39,
    tier: 4,
    pattern: /13pokies/i,
    description: '13Pokies gaming operator',
  },
  ttb88: {
    label: 'TTB88/TipTopBet88 Operator',
    priority: 40,
    tier: 4,
    pattern: /ttb88|tiptopbet88/i,
    description: 'TTB88 and TipTopBet88 gaming operator network',
  },
  securerabbit: {
    label: 'SecureRabbit Operator',
    priority: 41,
    tier: 4,
    pattern: /securerabbit|backuptesting|walletsystem/i,
    description: 'SecureRabbit gaming operator network',
  },
  ikaya28: {
    label: 'iKaya28 Operator',
    priority: 42,
    tier: 4,
    pattern: /ikaya28/i,
    description: 'iKaya28 gaming operator network',
  },
  matbet88: {
    label: 'MatBet88 Operator',
    priority: 43,
    tier: 4,
    pattern: /matbet88|matb8/i,
    description: 'MatBet88 gaming operator network',
  },
  '1play': {
    label: '1Play/OnePlaySG Operator',
    priority: 45,
    tier: 4,
    pattern: /1playsg|1plays\.|1play\.|oneplaysg/i,
    description: '1Play and OnePlaySG gaming operator network',
  },
  gwin7: {
    label: 'GWin7 Operator',
    priority: 47,
    tier: 4,
    pattern: /gwin7/i,
    description: 'GWin7 gaming operator network',
  },
  u2w: {
    label: 'U2Wallet Operator',
    priority: 48,
    tier: 4,
    pattern: /u2w|u2wallet|u288w/i,
    description: 'U2Wallet gaming operator network',
  },
};

/**
 * Returns the category definition for a given category name.
 * @param {string} name - The category name.
 * @returns {Object|null} Category definition or null if not found.
 */
function getCategory(name) {
  return CATEGORIES[name] || null;
}

/**
 * Returns all category names.
 * @returns {string[]} Array of category names.
 */
function getCategoryNames() {
  return Object.keys(CATEGORIES);
}

/**
 * Returns all categories belonging to a given tier.
 * @param {number} tier - The tier number.
 * @returns {Object} Map of category names to definitions for the given tier.
 */
function getCategoriesByTier(tier) {
  return Object.fromEntries(
    Object.entries(CATEGORIES).filter(([, cat]) => cat.tier === tier)
  );
}

/**
 * Detects the category for a given domain name using pattern matching.
 * @param {string} domain - The domain to classify.
 * @returns {string} The matched category name, or 'unknown' if no match.
 */
function detectCategory(domain) {
  for (const [name, cat] of Object.entries(CATEGORIES)) {
    if (cat.pattern.test(domain)) return name;
  }
  return 'unknown';
}

module.exports = {
  TIERS,
  CATEGORIES,
  getCategory,
  getCategoryNames,
  getCategoriesByTier,
  detectCategory,
};
