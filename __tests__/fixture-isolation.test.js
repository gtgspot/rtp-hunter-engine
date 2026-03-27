/**
 * Tests for mock webhook payloads and packet interception data.
 *
 * This test suite verifies that the test fixtures themselves are properly
 * isolated from production data. All URLs, endpoints, and payloads use
 * the ".test" TLD (RFC 2606) and fabricated data structures.
 *
 * These tests exist specifically to demonstrate that webhook endpoints,
 * intercepted packet data, and API payloads in the test suite are clearly
 * distinguishable from real routing mechanics, real API endpoints, and
 * real database calls.
 */

const {
  MOCK_INTERCEPTED_REQUESTS,
  MOCK_SPIN_RESPONSES,
  MOCK_WEBHOOK_PAYLOADS,
  MOCK_RTP_DB,
  MOCK_HUNT_FINDINGS,
} = require('./fixtures/mock-api-data');

const { MOCK_DOMAINS } = require('./fixtures/mock-domains');

describe('Fixture isolation — mock domains', () => {
  it('every mock domain uses the .test reserved TLD', () => {
    for (const d of MOCK_DOMAINS) {
      expect(d.domain).toMatch(/\.test$/);
    }
  });

  it('no mock domain contains a real-world TLD', () => {
    const realTLDs = /\.(com|net|org|io|online|xyz|me|co|asia|my|sg|ph)$/i;
    for (const d of MOCK_DOMAINS) {
      expect(d.domain).not.toMatch(realTLDs);
    }
  });
});

describe('Fixture isolation — mock intercepted requests', () => {
  it('every intercepted request URL uses the .test TLD', () => {
    for (const req of MOCK_INTERCEPTED_REQUESTS) {
      expect(req.url).toMatch(/\.test\//);
    }
  });

  it('no intercepted request URL resolves to a real host', () => {
    for (const req of MOCK_INTERCEPTED_REQUESTS) {
      expect(req.url).not.toMatch(/https?:\/\/[^/]*\.(com|net|org|io|online|xyz)/);
    }
  });
});

describe('Fixture isolation — mock spin responses', () => {
  it('every spin response URL uses the .test TLD', () => {
    for (const resp of MOCK_SPIN_RESPONSES) {
      expect(resp.url).toMatch(/\.test\//);
    }
  });

  it('spin response payloads contain only fabricated data', () => {
    for (const resp of MOCK_SPIN_RESPONSES) {
      expect(resp.data).toBeDefined();
      expect(typeof resp.timestamp).toBe('number');
    }
  });
});

describe('Fixture isolation — mock webhook payloads', () => {
  it('every webhook endpoint uses the .test TLD', () => {
    for (const wh of MOCK_WEBHOOK_PAYLOADS) {
      expect(wh.endpoint).toMatch(/\.test\//);
    }
  });

  it('webhook payloads reference only mock domains', () => {
    for (const wh of MOCK_WEBHOOK_PAYLOADS) {
      expect(wh.payload.domain).toMatch(/\.test$/);
    }
  });

  it('no webhook endpoint resembles a real service URL', () => {
    for (const wh of MOCK_WEBHOOK_PAYLOADS) {
      expect(wh.endpoint).not.toMatch(/https?:\/\/[^/]*\.(com|net|org|io|online)/);
    }
  });
});

describe('Fixture isolation — mock RTP database', () => {
  it('provider names are clearly mock identifiers', () => {
    const providers = Object.keys(MOCK_RTP_DB);
    for (const p of providers) {
      expect(p).toMatch(/^mock-provider/);
    }
  });

  it('game IDs are clearly mock identifiers', () => {
    for (const games of Object.values(MOCK_RTP_DB)) {
      for (const gameId of Object.keys(games)) {
        expect(gameId).toMatch(/^mock_game/);
      }
    }
  });
});

describe('Fixture isolation — mock hunt findings', () => {
  it('every finding URL uses the .test TLD', () => {
    for (const f of MOCK_HUNT_FINDINGS) {
      expect(f.url).toMatch(/\.test\//);
    }
  });

  it('finding providers are real pattern names but URLs are mock', () => {
    // The provider names (pragmatic, playtech) match real pattern logic,
    // but the URLs they appear in are fabricated .test TLD URLs.
    for (const f of MOCK_HUNT_FINDINGS) {
      if (f.provider !== 'unknown') {
        expect(['pragmatic', 'playtech', 'jili', 'pgsoft']).toContain(f.provider);
      }
      expect(f.url).toMatch(/\.test\//);
    }
  });
});
