'use strict';

/**
 * ResultAggregator — collects and aggregates RTP hunting results
 * across multiple domains into summary statistics and structured reports.
 */
class ResultAggregator {
  constructor() {
    this._results = [];
    this._errors = [];
    this._startedAt = new Date().toISOString();
  }

  /**
   * Adds a successful domain result to the aggregator.
   * @param {string} domain - The domain that was hunted.
   * @param {Array<Object>} findings - Array of finding objects from huntRTP.
   */
  addResult(domain, findings) {
    this._results.push({
      domain,
      findings: Array.isArray(findings) ? findings : [],
      huntedAt: new Date().toISOString(),
    });
  }

  /**
   * Records a failed domain hunt.
   * @param {string} domain - The domain that failed.
   * @param {string|Error} error - The error that occurred.
   */
  addError(domain, error) {
    this._errors.push({
      domain,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    });
  }

  /**
   * Returns all raw results.
   * @returns {Array<Object>}
   */
  getResults() {
    return this._results;
  }

  /**
   * Returns all error records.
   * @returns {Array<Object>}
   */
  getErrors() {
    return this._errors;
  }

  /**
   * Builds a comprehensive aggregated report.
   * @returns {Object} Report with per-domain summaries, provider stats, and overall metrics.
   */
  buildReport() {
    const totalDomains = this._results.length;
    const totalFindings = this._results.reduce((n, r) => n + r.findings.length, 0);

    const providerStats = {};
    const rtpValues = [];
    const domainsWithRtp = [];

    for (const { domain, findings } of this._results) {
      let domainRtp = null;

      for (const finding of findings) {
        const provider = finding.provider || 'unknown';
        if (!providerStats[provider]) {
          providerStats[provider] = { count: 0, rtpSum: 0, rtpCount: 0, games: {} };
        }
        providerStats[provider].count++;

        if (finding.rtp !== null && finding.rtp !== undefined) {
          providerStats[provider].rtpSum += finding.rtp;
          providerStats[provider].rtpCount++;
          rtpValues.push(finding.rtp);
          domainRtp = finding.rtp;

          const gameId = finding.gameId || 'unknown';
          providerStats[provider].games[gameId] = finding.rtp;
        }
      }

      if (domainRtp !== null) {
        domainsWithRtp.push({ domain, rtp: domainRtp });
      }
    }

    // Calculate per-provider average RTP
    const providerSummary = Object.fromEntries(
      Object.entries(providerStats).map(([provider, stats]) => [
        provider,
        {
          domainCount: stats.count,
          avgRtp: stats.rtpCount > 0
            ? parseFloat((stats.rtpSum / stats.rtpCount).toFixed(2))
            : null,
          games: stats.games,
        },
      ])
    );

    const avgRtp =
      rtpValues.length > 0
        ? parseFloat((rtpValues.reduce((s, v) => s + v, 0) / rtpValues.length).toFixed(2))
        : null;

    return {
      generatedAt: new Date().toISOString(),
      startedAt: this._startedAt,
      summary: {
        totalDomains,
        totalFindings,
        successfulDomains: this._results.length,
        failedDomains: this._errors.length,
        domainsWithRtp: domainsWithRtp.length,
        averageRtp: avgRtp,
      },
      providerStats: providerSummary,
      topRtpDomains: domainsWithRtp.sort((a, b) => b.rtp - a.rtp).slice(0, 10),
      errors: this._errors,
    };
  }

  /**
   * Resets the aggregator to an empty state.
   */
  reset() {
    this._results = [];
    this._errors = [];
    this._startedAt = new Date().toISOString();
  }
}

module.exports = ResultAggregator;
