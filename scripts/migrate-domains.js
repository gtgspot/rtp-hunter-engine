#!/usr/bin/env node
'use strict';

/**
 * migrate-domains.js
 *
 * Converts a legacy PHP-style associative array (or flat key=>value map) of
 * domains into the structured JSON format used by config/domains.json.
 *
 * Usage:
 *   node scripts/migrate-domains.js [input-file] [output-file]
 *
 * If no input file is provided, reads from stdin.
 * If no output file is provided, writes to stdout.
 *
 * Input format (PHP array-style text):
 *   [domain.com] => 9
 *   [another.domain.com] => 15
 *
 * Output format:
 *   [
 *     { "domain": "domain.com", "priority": 9, "tier": 2, "category": "bcb88" },
 *     ...
 *   ]
 */

const fs = require('fs');
const path = require('path');
const { detectCategory } = require('../src/config/domain-categories');
const { TIERS } = require('../src/config/domain-categories');

/**
 * Resolves the tier for a given priority value.
 * @param {number} priority
 * @returns {number} Tier number.
 */
function resolveTier(priority) {
  for (const [tier, def] of Object.entries(TIERS)) {
    const [min, max] = def.priorityRange;
    if (priority >= min && priority <= max) return Number(tier);
  }
  return 4; // default to highest tier for out-of-range priorities
}

/**
 * Parses a PHP-style associative array text into an array of { domain, priority } objects.
 * Accepts lines of the form:  [some.domain.com] => 15
 * @param {string} text - Raw input text.
 * @returns {Array<{domain: string, priority: number}>}
 */
function parseInput(text) {
  const results = [];
  const lineRegex = /\[([^\]]+)\]\s*=>\s*(\d+)/g;
  let match;
  while ((match = lineRegex.exec(text)) !== null) {
    const domain = match[1].trim();
    const priority = parseInt(match[2], 10);
    if (domain && !isNaN(priority)) {
      results.push({ domain, priority });
    }
  }
  return results;
}

/**
 * Enriches parsed domain entries with tier and category metadata.
 * @param {Array<{domain: string, priority: number}>} entries
 * @returns {Array<Object>} Structured domain objects.
 */
function enrichEntries(entries) {
  return entries.map(({ domain, priority }) => ({
    domain,
    priority,
    tier: resolveTier(priority),
    category: detectCategory(domain),
  }));
}

/**
 * Main migration entry point.
 */
async function main() {
  const [, , inputArg, outputArg] = process.argv;

  let inputText;
  if (inputArg) {
    const inputPath = path.resolve(inputArg);
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: input file not found: ${inputPath}`);
      process.exit(1);
    }
    inputText = fs.readFileSync(inputPath, 'utf8');
  } else {
    // Read from stdin
    inputText = fs.readFileSync('/dev/stdin', 'utf8');
  }

  const parsed = parseInput(inputText);
  if (parsed.length === 0) {
    console.error('Warning: no domain entries parsed. Check input format.');
    process.exit(1);
  }

  const enriched = enrichEntries(parsed);
  const output = JSON.stringify(enriched, null, 2);

  if (outputArg) {
    const outputPath = path.resolve(outputArg);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`Migrated ${enriched.length} domains → ${outputPath}`);
  } else {
    process.stdout.write(output + '\n');
    console.error(`Migrated ${enriched.length} domains.`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
