/**
 * Tests for RTP hunter detection and extraction logic.
 *
 * These tests exercise the provider-detection regex patterns and game-ID
 * extraction functions using fabricated mock URLs with the ".test" TLD
 * (RFC 2606). No real gaming API endpoints, webhook callbacks, or
 * production packet captures are referenced.
 *
 * The functions under test are re-implemented here because the source
 * module (rtp-hunter.js) does not export them individually. This mirrors
 * the exact logic to ensure pattern-matching works correctly without
 * launching a real browser or hitting real networks.
 */

/* ------------------------------------------------------------------ */
/*  Re-create the detection functions exactly as defined in source     */
/* ------------------------------------------------------------------ */

const KNOWN_PROVIDERS = [
  { name: 'pragmatic', pattern: /pragmatic/i },
  { name: 'playtech', pattern: /playtech|ptlive/i },
  { name: 'jili', pattern: /jili/i },
  { name: 'pgsoft', pattern: /pgsoft/i },
];

function detectProvider(url) {
  for (const p of KNOWN_PROVIDERS) {
    if (p.pattern.test(url)) return p.name;
  }
  return 'unknown';
}

function extractGameId(url) {
  const match =
    url.match(/game=([a-zA-Z0-9_]+)/) ||
    url.match(/\/games\/([a-zA-Z0-9_]+)/);
  return match ? match[1] : null;
}

/* ------------------------------------------------------------------ */
/*  Mock RTP database (fabricated values, not from any real provider)  */
/* ------------------------------------------------------------------ */

const MOCK_RTP_DB = {
  pragmatic: { mock_sweet_bonanza: 96.51, mock_gates_olympus: 96.50 },
  playtech: { mock_age_gods: 95.50 },
  jili: {},
  pgsoft: {},
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('RTP Hunter — provider detection', () => {
  it('detects "pragmatic" in a mock URL', () => {
    expect(detectProvider('https://mock-cdn.test/pragmatic/game-loader.js')).toBe('pragmatic');
  });

  it('detects "playtech" in a mock URL', () => {
    expect(detectProvider('https://mock-cdn.test/playtech/launch?session=fake')).toBe('playtech');
  });

  it('detects "playtech" via the ptlive alias', () => {
    expect(detectProvider('https://mock-ptlive.test/api/start')).toBe('playtech');
  });

  it('detects "jili" in a mock URL', () => {
    expect(detectProvider('https://mock-jili-games.test/api/spin')).toBe('jili');
  });

  it('detects "pgsoft" in a mock URL', () => {
    expect(detectProvider('https://mock-pgsoft.test/game/launch')).toBe('pgsoft');
  });

  it('returns "unknown" for a mock URL with no matching provider', () => {
    expect(detectProvider('https://mock-cdn.test/images/logo.png')).toBe('unknown');
  });
});

describe('RTP Hunter — game ID extraction', () => {
  it('extracts game ID from a "game=" query param in a mock URL', () => {
    expect(extractGameId('https://mock-provider.test/load?game=mock_sweet_bonanza')).toBe('mock_sweet_bonanza');
  });

  it('extracts game ID from a "/games/" path in a mock URL', () => {
    expect(extractGameId('https://mock-provider.test/games/mock_age_gods?session=test')).toBe('mock_age_gods');
  });

  it('returns null when no game ID pattern matches a mock URL', () => {
    expect(extractGameId('https://mock-cdn.test/assets/style.css')).toBeNull();
  });
});

describe('RTP Hunter — RTP resolution from mock database', () => {
  it('resolves a known mock game RTP', () => {
    const provider = 'pragmatic';
    const gameId = 'mock_sweet_bonanza';
    const rtp = MOCK_RTP_DB[provider]?.[gameId] || null;
    expect(rtp).toBe(96.51);
  });

  it('returns null for an unknown mock game', () => {
    const rtp = MOCK_RTP_DB['pragmatic']?.['nonexistent_game'] || null;
    expect(rtp).toBeNull();
  });

  it('returns null for a provider with an empty mock game catalog', () => {
    const rtp = MOCK_RTP_DB['jili']?.['any_game'] || null;
    expect(rtp).toBeNull();
  });
});

describe('RTP Hunter — end-to-end mock intercept simulation', () => {
  /**
   * Simulates the full intercept → detect → resolve pipeline
   * using entirely fabricated URLs and data.
   */
  it('processes a set of mock intercepted requests', () => {
    const mockRequests = [
      'https://mock-pragmatic.test/api/load?game=mock_sweet_bonanza',
      'https://mock-playtech.test/games/mock_age_gods',
      'https://mock-cdn.test/static/font.woff2',
    ];

    const findings = mockRequests.map((url) => {
      const provider = detectProvider(url);
      const gameId = extractGameId(url);
      return { url, provider, gameId };
    });

    // Resolve RTP
    const resolved = findings.map((f) => ({
      ...f,
      rtp: (f.provider && f.gameId) ? (MOCK_RTP_DB[f.provider]?.[f.gameId] || null) : null,
    }));

    expect(resolved).toHaveLength(3);

    // First: pragmatic + mock_sweet_bonanza → 96.51
    expect(resolved[0].provider).toBe('pragmatic');
    expect(resolved[0].gameId).toBe('mock_sweet_bonanza');
    expect(resolved[0].rtp).toBe(96.51);

    // Second: playtech + mock_age_gods → 95.50
    expect(resolved[1].provider).toBe('playtech');
    expect(resolved[1].gameId).toBe('mock_age_gods');
    expect(resolved[1].rtp).toBe(95.50);

    // Third: unknown + no game → null
    expect(resolved[2].provider).toBe('unknown');
    expect(resolved[2].gameId).toBeNull();
    expect(resolved[2].rtp).toBeNull();
  });
});
