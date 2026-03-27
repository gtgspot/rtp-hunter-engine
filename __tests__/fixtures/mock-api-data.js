/**
 * TEST FIXTURES — Mock API Intercept Data
 *
 * These URLs, payloads, and webhook addresses are entirely fabricated.
 * They use the reserved ".test" TLD (RFC 2606) and invented paths so
 * that they CANNOT be confused with real API routing, webhooks, or
 * network packet captures from production systems.
 */

/**
 * Simulated network requests that would be captured by the packet
 * interceptor during a hunt. None of these URLs resolve to real services.
 */
const MOCK_INTERCEPTED_REQUESTS = [
  {
    url: 'https://mock-provider-pragmatic.test/game-api/v1/load?game=sweet_bonanza',
    method: 'GET',
    provider: 'pragmatic',
    gameId: 'sweet_bonanza',
  },
  {
    url: 'https://mock-provider-playtech.test/games/age_of_the_gods?session=fake-session-id',
    method: 'GET',
    provider: 'playtech',
    gameId: 'age_of_the_gods',
  },
  {
    url: 'https://cdn.mock-assets.test/static/images/logo.png',
    method: 'GET',
    provider: 'unknown',
    gameId: null,
  },
  {
    url: 'https://mock-provider-jili.test/api/spin?bet=1.00&game=fortune_gems',
    method: 'POST',
    provider: 'jili',
    gameId: null,
  },
  {
    url: 'https://mock-provider-pgsoft.test/api/play/gems_bonanza',
    method: 'POST',
    provider: 'pgsoft',
    gameId: null,
  },
];

/**
 * Simulated spin API responses. These payloads are fabricated
 * and do not reflect any real game API structure.
 */
const MOCK_SPIN_RESPONSES = [
  {
    type: 'response',
    url: 'https://mock-provider.test/api/spin',
    data: { bet: 1.0, win: 2.5, result: { symbols: ['A', 'A', 'A'] } },
    timestamp: 1700000000000,
  },
  {
    type: 'response',
    url: 'https://mock-provider.test/api/play',
    data: { stake: 0.5, payout: 0.0, outcome: { symbols: ['B', 'C', 'D'] } },
    timestamp: 1700000001000,
  },
  {
    type: 'response',
    url: 'https://mock-provider.test/api/spin',
    data: { wager: 2.0, return: 10.0, result: { symbols: ['7', '7', '7'] } },
    timestamp: 1700000002000,
  },
];

/**
 * Mock webhook payloads. These are entirely fake and do not correspond
 * to any real webhook integration or callback URL.
 */
const MOCK_WEBHOOK_PAYLOADS = [
  {
    endpoint: 'https://mock-webhook-receiver.test/hooks/hunt-complete',
    payload: {
      event: 'hunt.completed',
      domain: 'mock-casino-alpha.test',
      findingsCount: 3,
      timestamp: '2025-01-01T00:00:00.000Z',
    },
  },
  {
    endpoint: 'https://mock-webhook-receiver.test/hooks/hunt-error',
    payload: {
      event: 'hunt.failed',
      domain: 'mock-casino-beta.test',
      error: 'Simulated timeout for testing',
      timestamp: '2025-01-01T00:01:00.000Z',
    },
  },
];

/**
 * Mock RTP database entries. These game names and RTP values
 * are fabricated test data, not sourced from any real provider.
 */
const MOCK_RTP_DB = {
  'mock-provider-a': {
    mock_game_alpha: 96.50,
    mock_game_beta: 95.00,
  },
  'mock-provider-b': {
    mock_game_gamma: 94.25,
  },
  'mock-provider-c': {},
};

/**
 * Mock hunt result findings. These represent the output structure
 * from huntRTP using entirely fabricated data.
 */
const MOCK_HUNT_FINDINGS = [
  { url: 'https://mock-provider-pragmatic.test/load?game=mock_slots', provider: 'pragmatic', gameId: 'mock_slots', rtp: 96.51 },
  { url: 'https://mock-provider-playtech.test/games/mock_roulette', provider: 'playtech', gameId: 'mock_roulette', rtp: 95.50 },
  { url: 'https://mock-cdn.test/assets/banner.jpg', provider: 'unknown', gameId: null, rtp: null },
];

module.exports = {
  MOCK_INTERCEPTED_REQUESTS,
  MOCK_SPIN_RESPONSES,
  MOCK_WEBHOOK_PAYLOADS,
  MOCK_RTP_DB,
  MOCK_HUNT_FINDINGS,
};
