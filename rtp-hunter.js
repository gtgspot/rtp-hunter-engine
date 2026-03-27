import { chromium } from "playwright";

const KNOWN_PROVIDERS = [
  { name: "pragmatic", pattern: /pragmatic/i },
  { name: "playtech", pattern: /playtech|ptlive/i },
  { name: "jili", pattern: /jili/i },
  { name: "pgsoft", pattern: /pgsoft/i }
];

const RTP_DB = {
  pragmatic: {
    "sweet_bonanza": 96.51,
    "gates_of_olympus": 96.50
  },
  playtech: {
    "age_of_the_gods": 95.50
  },
  jili: {},
  pgsoft: {}
};

function detectProvider(url) {
  for (let p of KNOWN_PROVIDERS) {
    if (p.pattern.test(url)) return p.name;
  }
  return "unknown";
}

function extractGameId(url) {
  const match =
    url.match(/game=([a-zA-Z0-9_]+)/) ||
    url.match(/\/games\/([a-zA-Z0-9_]+)/);

  return match ? match[1] : null;
}

export async function huntRTP(domain) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const findings = [];

  // Intercept network traffic
  page.on("request", (req) => {
    const url = req.url();

    const provider = detectProvider(url);
    const gameId = extractGameId(url);

    if (provider !== "unknown" || gameId) {
      findings.push({
        url,
        provider,
        gameId
      });
    }
  });

  try {
    await page.goto(`http://${domain}`, {
      timeout: 15000,
      waitUntil: 'networkidle'
    });
  } catch (e) {
    await browser.close();
    return [{ error: e.message, url: `http://${domain}` }];
  }

  await browser.close();

  // Resolve RTP
  const resolved = findings.map((f) => {
    let rtp = null;

    if (f.provider && f.gameId) {
      rtp =
        RTP_DB[f.provider]?.[f.gameId] || null;
    }

    return {
      ...f,
      rtp
    };
  });

  return resolved;
}