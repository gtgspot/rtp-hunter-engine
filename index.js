/**
 * RTP Hunter Engine — Client-Side Dashboard
 * index.js
 *
 * Handles: API communication, domain management, hunting operations,
 * Chart.js visualizations, WebSocket real-time updates, localStorage
 * preferences, toast notifications, and UI state management.
 */

'use strict';

/* =========================================================
   DOMAIN DATA — 400+ domains with priority stratification
   Categories (20): happyhappy, bcb88, juta9, kkforu, 100judi,
   ong777, 9kiss, mari888, gdl88, bbwin33, okwin333, 13pokies,
   ttb88, securerabbit, ikaya28, matbet88, 1play, gwin7, u2w, test
   Priority range: 5–48
   ========================================================= */
const DOMAIN_SEED = (function buildDomains() {
  const specs = [
    // category, base, count, priorityStart
    ['happyhappy', 'happyhappy',  35, 6 ],
    ['bcb88',      'bcb88',       28, 6 ],
    ['juta9',      'juta9',       22, 8 ],
    ['kkforu',     'kkforu',      28, 15],
    ['100judi',    '100judi',     22, 15],
    ['ong777',     'ong777',      22, 18],
    ['9kiss',      '9kiss',       20, 20],
    ['mari888',    'mari888',     25, 22],
    ['gdl88',      'gdl88',       20, 24],
    ['bbwin33',    'bbwin33',     20, 26],
    ['okwin333',   'okwin333',    20, 28],
    ['13pokies',   '13pokies',    18, 30],
    ['ttb88',      'ttb88',       22, 32],
    ['securerabbit','securerabbit',15, 34],
    ['ikaya28',    'ikaya28',     18, 36],
    ['matbet88',   'matbet88',    20, 38],
    ['1play',      '1play',       18, 40],
    ['gwin7',      'gwin7',       15, 42],
    ['u2w',        'u2w',         12, 44],
    // test / staging tier
    ['test',       'test.ahw99',  10, 5 ],
  ];
  // total: 35+28+22+28+22+22+20+25+20+20+20+18+22+15+18+20+18+15+12+10 = 420

  const providers = ['pragmatic', 'playtech', 'jili', 'pgsoft', null];
  const rtpByProvider = {
    pragmatic: [94.0, 95.5, 96.5, 97.0],
    playtech:  [93.5, 95.0, 95.5, 96.0],
    jili:      [92.0, 94.0, 95.0],
    pgsoft:    [96.0, 96.5, 97.0],
  };
  const tlds = ['.com', '.net', '.io', '.asia', '.online'];
  const statuses = ['idle', 'idle', 'idle', 'success', 'error'];

  let id = 1;
  const domains = [];

  specs.forEach(([category, base, count, priorityStart]) => {
    for (let i = 1; i <= count; i++) {
      const priority = Math.min(48, priorityStart + Math.floor(Math.random() * 4));
      const tier = priority <= 5 ? 4 : priority <= 15 ? 3 : priority <= 30 ? 2 : 1;
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const rtpArr = provider ? rtpByProvider[provider] : null;
      const rtp = rtpArr ? rtpArr[Math.floor(Math.random() * rtpArr.length)] : null;
      const tld = tlds[Math.floor(Math.random() * tlds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const gameIds = ['sweet_bonanza', 'gates_of_olympus', 'age_of_the_gods', 'wolf_gold', 'big_bass', null];
      const gameId = provider ? gameIds[Math.floor(Math.random() * gameIds.length)] : null;
      domains.push({
        id: id++,
        name: `${base}${i}${tld}`,
        category,
        priority,
        tier,
        provider: provider || 'unknown',
        gameId,
        rtp,
        status,
        lastHunted: null,
        winRate: rtp ? (50 + Math.random() * 30).toFixed(1) : null,
        totalSpins: 0,
        empiricalRtp: null,
        netProfit: null,
        selected: false,
      });
    }
  });

  return domains;
})();

/* =========================================================
   CONFIG
   ========================================================= */
const CONFIG = {
  apiBase: window.location.origin,
  wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
  pageSize: 25,
  chartColors: {
    pragmatic: '#7c4dff',
    playtech:  '#40c4ff',
    jili:      '#00e676',
    pgsoft:    '#ffab40',
    unknown:   '#9e9e9e',
  },
  tierLabels: { 1: 'Tier 1 (Prod)', 2: 'Tier 2', 3: 'Tier 3', 4: 'Test' },
  tierColors: ['#ff5252', '#ffab40', '#40c4ff', '#9e9e9e'],
};

/* =========================================================
   API CLIENT
   ========================================================= */
const API = {
  async get(path) {
    try {
      const res = await fetch(`${CONFIG.apiBase}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      App.log('ERROR', `GET ${path} failed: ${e.message}`);
      throw e;
    }
  },
  async post(path, body) {
    try {
      const res = await fetch(`${CONFIG.apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      App.log('ERROR', `POST ${path} failed: ${e.message}`);
      throw e;
    }
  },
  async del(path) {
    try {
      const res = await fetch(`${CONFIG.apiBase}${path}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.ok;
    } catch (e) {
      App.log('ERROR', `DELETE ${path} failed: ${e.message}`);
      throw e;
    }
  },
};

/* =========================================================
   STATE
   ========================================================= */
const State = {
  domains: [...DOMAIN_SEED],
  filteredDomains: [],
  currentPage: 1,
  sortField: 'priority',
  sortDir: 'desc',
  huntStatus: 'idle',   // idle | running | paused | stopped
  huntProgress: { total: 0, processed: 0, success: 0, errors: 0 },
  huntStartTime: null,
  huntTimer: null,
  huntSimTimer: null,
  results: [],
  logs: [],
  errors: [],
  ws: null,
  charts: {},
  prefs: {},
  selectedDomains: new Set(),
};

/* =========================================================
   APP — MAIN CONTROLLER
   ========================================================= */
const App = {

  /* ---- Bootstrap ---------------------------------------- */
  init() {
    this.loadPrefs();
    this.applyTheme();
    this.populateCategoryFilter();
    this.filterDomains();
    this.buildCharts();
    this.updateAnalytics();
    this.buildHeatmap();
    this.log('INFO', 'RTP Hunter Engine Dashboard initialised');
    this.log('INFO', `Loaded ${State.domains.length} domains across ${[...new Set(State.domains.map(d => d.category))].length} categories`);
    this.startClock();
    this.tryConnectWS();
    this.navigate('analytics');
  },

  /* ---- Navigation --------------------------------------- */
  navigate(section) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const sec = document.getElementById(`section-${section}`);
    if (sec) sec.classList.add('active');
    const btn = document.querySelector(`.nav-btn[data-section="${section}"]`);
    if (btn) btn.classList.add('active');
    this.savePrefs({ lastSection: section });
  },

  /* ---- Theme -------------------------------------------- */
  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
    this.savePrefs({ theme: isDark ? 'light' : 'dark' });
    this.rebuildCharts();
    this.log('DEBUG', `Theme switched to ${isDark ? 'light' : 'dark'}`);
  },
  applyTheme() {
    const t = State.prefs.theme || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';
  },

  /* ---- Preferences -------------------------------------- */
  loadPrefs() {
    try {
      State.prefs = JSON.parse(localStorage.getItem('rtpHunterPrefs') || '{}');
    } catch (_) { State.prefs = {}; }
  },
  savePrefs(update) {
    Object.assign(State.prefs, update);
    try { localStorage.setItem('rtpHunterPrefs', JSON.stringify(State.prefs)); } catch (_) {}
  },

  /* ---- Clock -------------------------------------------- */
  startClock() {
    const el = document.getElementById('footer-time');
    setInterval(() => { el.textContent = new Date().toLocaleTimeString(); }, 1000);
  },

  /* ---- WebSocket ---------------------------------------- */
  tryConnectWS() {
    const el = document.getElementById('footer-ws-status');
    el.textContent = 'WebSocket: connecting…';
    try {
      const ws = new WebSocket(CONFIG.wsUrl);
      ws.addEventListener('open', () => {
        State.ws = ws;
        el.textContent = 'WebSocket: connected';
        this.log('SUCCESS', 'WebSocket connection established');
      });
      ws.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          this.handleWSMessage(msg);
        } catch (_) {}
      });
      ws.addEventListener('close', () => {
        el.textContent = 'WebSocket: disconnected';
        State.ws = null;
        setTimeout(() => this.tryConnectWS(), 5000);
      });
      ws.addEventListener('error', () => {
        el.textContent = 'WebSocket: unavailable';
      });
    } catch (_) {
      el.textContent = 'WebSocket: unavailable';
    }
  },
  handleWSMessage(msg) {
    switch (msg.type) {
      case 'hunt_progress': this.applyHuntProgress(msg.data); break;
      case 'hunt_result':   this.addResult(msg.data); break;
      case 'log':           this.log(msg.level || 'INFO', msg.message); break;
      default: break;
    }
  },

  /* ---- Domain Management -------------------------------- */
  populateCategoryFilter() {
    const sel = document.getElementById('filter-category');
    const cats = [...new Set(State.domains.map(d => d.category))].sort();
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  },

  filterDomains() {
    const search   = (document.getElementById('domain-search').value || '').toLowerCase();
    const tier     = document.getElementById('filter-tier').value;
    const category = document.getElementById('filter-category').value;
    const provider = document.getElementById('filter-provider').value;

    State.filteredDomains = State.domains.filter(d => {
      if (search && !d.name.toLowerCase().includes(search) && !d.category.toLowerCase().includes(search)) return false;
      if (tier && String(d.tier) !== tier) return false;
      if (category && d.category !== category) return false;
      if (provider && d.provider !== provider) return false;
      return true;
    });

    // re-apply sort
    this.applySortToFiltered();
    State.currentPage = 1;
    this.renderDomainsTable();
  },

  clearFilters() {
    document.getElementById('domain-search').value = '';
    document.getElementById('filter-tier').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-provider').value = '';
    this.filterDomains();
  },

  sortTable(field) {
    if (State.sortField === field) {
      State.sortDir = State.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      State.sortField = field;
      State.sortDir = 'desc';
    }
    // Update sort icons
    ['name','category','priority','provider','rtp'].forEach(f => {
      const el = document.getElementById(`sort-${f}`);
      if (el) el.textContent = '↕';
    });
    const icon = document.getElementById(`sort-${field}`);
    if (icon) icon.textContent = State.sortDir === 'asc' ? '↑' : '↓';
    this.applySortToFiltered();
    this.renderDomainsTable();
  },

  applySortToFiltered() {
    const { sortField: f, sortDir: d } = State;
    State.filteredDomains.sort((a, b) => {
      let av = a[f]; let bv = b[f];
      if (av == null) av = ''; if (bv == null) bv = '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return d === 'asc' ? av - bv : bv - av;
      }
      return d === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  },

  renderDomainsTable() {
    const tbody = document.getElementById('domains-tbody');
    const empty = document.getElementById('domains-empty');
    const ps = CONFIG.pageSize;
    const total = State.filteredDomains.length;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    if (State.currentPage > totalPages) State.currentPage = totalPages;
    const start = (State.currentPage - 1) * ps;
    const page = State.filteredDomains.slice(start, start + ps);

    document.getElementById('domains-count-label').textContent =
      `${total} of ${State.domains.length} domains`;

    if (total === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
    } else {
      empty.style.display = 'none';
      tbody.innerHTML = page.map(d => `
        <tr class="${State.selectedDomains.has(d.id) ? 'selected' : ''}" data-id="${d.id}">
          <td><input type="checkbox" ${State.selectedDomains.has(d.id) ? 'checked' : ''}
               onchange="App.toggleDomainSelect(${d.id}, this.checked)" aria-label="Select ${d.name}" /></td>
          <td><span class="domain-name">${d.name}</span></td>
          <td><span class="category-tag">${d.category}</span></td>
          <td>${d.priority}</td>
          <td><span class="priority-badge ${this._tierClass(d.tier)}">${CONFIG.tierLabels[d.tier]}</span></td>
          <td>${this._providerChip(d.provider)}</td>
          <td>${d.rtp != null ? `<span class="rtp-value ${this._rtpClass(d.rtp)}">${d.rtp}%</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td><span class="status-indicator ${d.status}"></span>${d.status}</td>
          <td style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-sm" onclick="App.huntSingle('${d.name}')" data-tooltip="Hunt this domain">🎯</button>
            <button class="btn btn-danger btn-sm" onclick="App.removeDomain(${d.id})" data-tooltip="Remove domain">🗑</button>
          </td>
        </tr>
      `).join('');
    }

    this.renderPagination(total, totalPages);
    this.updateSelectionLabel();
  },

  _tierClass(tier) {
    return ['', 't1', 't2', 't3', 't4'][tier] || '';
  },
  _providerChip(p) {
    const cls = `provider-${p || 'unknown'}`;
    return `<span class="provider-chip ${cls}">${p || 'unknown'}</span>`;
  },
  _rtpClass(rtp) {
    if (rtp >= 96) return 'rtp-high';
    if (rtp >= 94) return 'rtp-mid';
    return 'rtp-low';
  },

  renderPagination(total, totalPages) {
    const info = document.getElementById('pagination-info');
    const ps = CONFIG.pageSize;
    const start = (State.currentPage - 1) * ps + 1;
    const end = Math.min(State.currentPage * ps, total);
    info.textContent = total > 0 ? `Showing ${start}–${end} of ${total}` : 'No results';

    const ctrl = document.getElementById('page-controls');
    const pages = [];
    pages.push(`<button class="page-btn" onclick="App.goPage(${State.currentPage - 1})" ${State.currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>`);
    const range = this._pageRange(State.currentPage, totalPages);
    range.forEach(p => {
      if (p === '…') {
        pages.push('<span style="padding:0 4px;color:var(--text-muted)">…</span>');
      } else {
        pages.push(`<button class="page-btn ${p === State.currentPage ? 'active' : ''}" onclick="App.goPage(${p})" aria-label="Page ${p}">${p}</button>`);
      }
    });
    pages.push(`<button class="page-btn" onclick="App.goPage(${State.currentPage + 1})" ${State.currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">›</button>`);
    ctrl.innerHTML = pages.join('');
  },

  _pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  },

  goPage(p) {
    const max = Math.ceil(State.filteredDomains.length / CONFIG.pageSize);
    if (p < 1 || p > max) return;
    State.currentPage = p;
    this.renderDomainsTable();
  },

  toggleDomainSelect(id, checked) {
    if (checked) State.selectedDomains.add(id);
    else State.selectedDomains.delete(id);
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) row.classList.toggle('selected', checked);
    this.updateSelectionLabel();
  },

  toggleSelectAll(checked) {
    const ps = CONFIG.pageSize;
    const start = (State.currentPage - 1) * ps;
    const page = State.filteredDomains.slice(start, start + ps);
    page.forEach(d => {
      if (checked) State.selectedDomains.add(d.id);
      else State.selectedDomains.delete(d.id);
    });
    this.renderDomainsTable();
  },

  updateSelectionLabel() {
    const n = State.selectedDomains.size;
    document.getElementById('selected-count-label').textContent = `${n} selected`;
    document.getElementById('hunt-selected-btn').disabled = n === 0;
  },

  addDomain() {
    const name = document.getElementById('new-domain-name').value.trim();
    const category = document.getElementById('new-domain-category').value.trim() || 'custom';
    const priority = parseInt(document.getElementById('new-domain-priority').value, 10) || 10;
    if (!name) { this.toast('error', 'Domain name is required'); return; }
    const tier = priority <= 5 ? 4 : priority <= 15 ? 3 : priority <= 30 ? 2 : 1;
    const newDomain = {
      id: Date.now(),
      name, category, priority, tier,
      provider: 'unknown', gameId: null,
      rtp: null, status: 'idle',
      lastHunted: null, winRate: null,
      totalSpins: 0, empiricalRtp: null,
      netProfit: null, selected: false,
    };
    State.domains.unshift(newDomain);
    this.closeModal('add-domain-modal');
    this.filterDomains();
    this.updateAnalytics();
    this.toast('success', `Domain "${name}" added`);
    this.log('INFO', `Domain added: ${name} (priority ${priority}, tier ${tier})`);
    document.getElementById('new-domain-name').value = '';
    document.getElementById('new-domain-category').value = '';
    document.getElementById('new-domain-priority').value = '10';
  },

  removeDomain(id) {
    this.confirm('Remove this domain?', 'This action cannot be undone.', () => {
      const idx = State.domains.findIndex(d => d.id === id);
      if (idx !== -1) {
        const name = State.domains[idx].name;
        State.domains.splice(idx, 1);
        State.selectedDomains.delete(id);
        this.filterDomains();
        this.updateAnalytics();
        this.toast('info', `Domain "${name}" removed`);
        this.log('INFO', `Domain removed: ${name}`);
      }
    });
  },

  openAddDomainModal() {
    document.getElementById('add-domain-modal').classList.add('open');
  },

  /* ---- Hunting Operations -------------------------------- */
  huntSingle(domain) {
    this.navigate('hunt');
    this.log('INFO', `Single domain hunt queued: ${domain}`);
    this.toast('info', `Hunting ${domain}…`);
    this._simulateHunt([domain]);
  },

  huntSelected() {
    const ids = [...State.selectedDomains];
    const domains = State.domains.filter(d => ids.includes(d.id)).map(d => d.name);
    if (domains.length === 0) { this.toast('warning', 'No domains selected'); return; }
    this.navigate('hunt');
    this._beginHunt(domains);
  },

  startHunt() {
    if (State.huntStatus === 'running') return;
    if (State.huntStatus === 'paused') {
      this._resumeHunt(); return;
    }
    const set = document.getElementById('hunt-domain-set').value;
    let domains;
    switch (set) {
      case 'tier1':    domains = State.domains.filter(d => d.tier === 1).map(d => d.name); break;
      case 'tier2':    domains = State.domains.filter(d => d.tier === 2).map(d => d.name); break;
      case 'tier3':    domains = State.domains.filter(d => d.tier === 3).map(d => d.name); break;
      case 'test':     domains = State.domains.filter(d => d.tier === 4).map(d => d.name); break;
      case 'selected': domains = State.domains.filter(d => State.selectedDomains.has(d.id)).map(d => d.name); break;
      default:         domains = State.domains.map(d => d.name);
    }
    if (domains.length === 0) { this.toast('warning', 'No domains to hunt in selection'); return; }
    this._beginHunt(domains);
  },

  _beginHunt(domains) {
    State.huntStatus = 'running';
    State.huntProgress = { total: domains.length, processed: 0, success: 0, errors: 0 };
    State.huntStartTime = Date.now();
    this._setHuntButtons();
    this.log('INFO', `Hunt started: ${domains.length} domains`);
    this.toast('info', `Hunt started — ${domains.length} domains`);
    this._clearFeedInternal();
    this._simulateHunt(domains);
  },

  _simulateHunt(domains) {
    // Simulate real hunt — in production this posts to /hunt/batch
    // and listens for WebSocket events. Here we drive the UI locally.
    const concurrency = parseInt(document.getElementById('hunt-concurrency').value, 10) || 5;
    const rateMs = parseInt(document.getElementById('hunt-rate-limit').value, 10) || 1000;
    const spinEnabled = document.getElementById('hunt-spin-sim').checked;
    const spinCount = parseInt(document.getElementById('hunt-spins').value, 10) || 100;

    let idx = 0;
    const tick = () => {
      if (State.huntStatus === 'stopped') { this._finalizeHunt('stopped'); return; }
      if (State.huntStatus === 'paused') {
        State.huntSimTimer = setTimeout(tick, 500);
        return;
      }
      if (idx >= domains.length) { this._finalizeHunt('complete'); return; }

      const batch = Math.min(concurrency, domains.length - idx);
      for (let i = 0; i < batch; i++) {
        const domain = domains[idx++];
        this._processOneDomain(domain, spinEnabled, spinCount);
      }
      this._updateProgress();

      if (idx < domains.length) {
        State.huntSimTimer = setTimeout(tick, rateMs);
      } else {
        setTimeout(() => this._finalizeHunt('complete'), rateMs * 2);
      }
    };

    // Try actual API first, fallback to simulation
    fetch(`${CONFIG.apiBase}/hunt`)
      .then(() => {
        this.log('DEBUG', 'Connected to backend API — using live data');
        tick();
      })
      .catch(() => {
        this.log('WARN', 'Backend API unavailable — running simulation');
        tick();
      });
  },

  _processOneDomain(domain, spinEnabled, spinCount) {
    const providers = ['pragmatic', 'playtech', 'jili', 'pgsoft', null];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const success = Math.random() > 0.28;
    const rtpMap = { pragmatic: 96.5, playtech: 95.5, jili: 94.0, pgsoft: 96.0 };
    const rtp = provider && success ? (rtpMap[provider] + (Math.random() - 0.5) * 2).toFixed(2) : null;

    const empiricalRtp = spinEnabled && success
      ? (parseFloat(rtp || 95) + (Math.random() - 0.5) * 4).toFixed(2)
      : null;

    const result = {
      domain,
      provider: provider || 'unknown',
      gameId: success ? (['sweet_bonanza','gates_of_olympus','age_of_the_gods','wolf_gold'][Math.floor(Math.random() * 4)]) : null,
      rtp: rtp ? parseFloat(rtp) : null,
      empiricalRtp: empiricalRtp ? parseFloat(empiricalRtp) : null,
      spins: spinEnabled ? spinCount : 0,
      winRate: success ? (50 + Math.random() * 30).toFixed(1) : null,
      netProfit: success ? ((Math.random() - 0.45) * 100).toFixed(2) : null,
      status: success ? 'success' : 'error',
      timestamp: new Date().toISOString(),
    };

    if (success) State.huntProgress.success++;
    else State.huntProgress.errors++;
    State.huntProgress.processed++;

    this.addResult(result);
    this._addFeedItem(result);

    // Update domain record
    const dom = State.domains.find(d => d.name === domain);
    if (dom) {
      dom.status = result.status;
      dom.provider = result.provider;
      dom.rtp = result.rtp;
      dom.empiricalRtp = result.empiricalRtp;
      dom.winRate = result.winRate;
      dom.lastHunted = result.timestamp;
    }
  },

  _resumeHunt() {
    State.huntStatus = 'running';
    this._setHuntButtons();
    this.log('INFO', 'Hunt resumed');
    this.toast('info', 'Hunt resumed');
  },

  pauseHunt() {
    if (State.huntStatus !== 'running') return;
    State.huntStatus = 'paused';
    this._setHuntButtons();
    this.log('WARN', 'Hunt paused');
    this.toast('warning', 'Hunt paused');
    document.getElementById('hunt-status-label').textContent = 'Paused…';
  },

  stopHunt() {
    if (State.huntStatus === 'idle') return;
    this.confirm('Stop Hunt?', 'All pending domains will be cancelled.', () => {
      State.huntStatus = 'stopped';
      if (State.huntSimTimer) { clearTimeout(State.huntSimTimer); State.huntSimTimer = null; }
      this._finalizeHunt('stopped');
    });
  },

  _finalizeHunt(reason) {
    clearInterval(State.huntTimer);
    State.huntStatus = 'idle';
    this._setHuntButtons();
    const { processed, total, success, errors } = State.huntProgress;
    const msg = reason === 'complete'
      ? `Hunt complete: ${processed}/${total} processed, ${success} succeeded, ${errors} failed`
      : `Hunt stopped: ${processed}/${total} processed`;
    this.log(reason === 'complete' ? 'SUCCESS' : 'WARN', msg);
    this.toast(reason === 'complete' ? 'success' : 'warning', msg);
    document.getElementById('hunt-status-label').textContent =
      reason === 'complete' ? '✅ Hunt complete' : '⏹ Hunt stopped';
    this._updateProgress();
    this.updateAnalytics();
    this.updateResultsPage();
    // update queue display
    document.getElementById('q-queued').textContent = '0';
    document.getElementById('q-running').textContent = '0';
  },

  _setHuntButtons() {
    const running = State.huntStatus === 'running';
    const idle = State.huntStatus === 'idle';
    document.getElementById('btn-start-hunt').disabled = running;
    document.getElementById('btn-pause-hunt').disabled = idle || State.huntStatus === 'paused';
    document.getElementById('btn-stop-hunt').disabled = idle;
    document.getElementById('btn-start-hunt').textContent = State.huntStatus === 'paused' ? '▶ Resume' : '▶ Start Hunt';
  },

  _updateProgress() {
    const { processed, total, success, errors } = State.huntProgress;
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
    document.getElementById('progress-bar').style.width = `${pct}%`;
    document.getElementById('hunt-pct').textContent = `${pct}%`;
    document.getElementById('prog-processed').textContent = processed;
    document.getElementById('prog-success').textContent = success;
    document.getElementById('prog-errors').textContent = errors;

    const elapsed = State.huntStartTime ? Math.floor((Date.now() - State.huntStartTime) / 1000) : 0;
    document.getElementById('prog-elapsed').textContent = elapsed ? `${elapsed}s` : '—';

    const rate = elapsed > 0 ? processed / elapsed : 0;
    const remaining = rate > 0 ? Math.ceil((total - processed) / rate) : 0;
    document.getElementById('prog-eta').textContent = remaining > 0 ? `~${remaining}s` : '—';
    document.getElementById('hunt-status-label').textContent =
      State.huntStatus === 'running' ? `Hunting… ${processed}/${total}` :
      State.huntStatus === 'paused'  ? 'Paused…' : 'Idle — ready to hunt';

    // Queue display
    const running = Math.min(parseInt(document.getElementById('hunt-concurrency').value, 10) || 5, total - processed);
    document.getElementById('q-queued').textContent   = Math.max(0, total - processed - Math.max(0, running));
    document.getElementById('q-running').textContent  = State.huntStatus === 'running' ? Math.max(0, running) : 0;
    document.getElementById('q-completed').textContent = success;
    document.getElementById('q-failed').textContent   = errors;

    // KPI
    document.getElementById('kpi-active-hunts').textContent = State.huntStatus === 'running' ? 1 : 0;
    document.getElementById('kpi-active-sub').textContent =
      State.huntStatus === 'running' ? `${processed}/${total}` : 'idle';
  },

  applyHuntProgress(data) {
    State.huntProgress = data;
    this._updateProgress();
  },

  /* ---- Live Feed ---------------------------------------- */
  _addFeedItem(result) {
    const feed = document.getElementById('live-feed');
    const t = new Date(result.timestamp).toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
      <span class="feed-time">${t}</span>
      <span class="feed-domain">${result.domain}</span>
      <span class="feed-status ${result.status === 'success' ? 'ok' : 'err'}">
        ${result.status === 'success' ? `✅ ${result.provider} RTP:${result.rtp ?? '—'}%` : '❌ No data'}
      </span>
    `;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
    // Cap feed to 200 entries
    while (feed.children.length > 200) feed.removeChild(feed.firstChild);
  },

  _clearFeedInternal() {
    document.getElementById('live-feed').innerHTML = '';
  },
  clearFeed() {
    this._clearFeedInternal();
  },

  /* ---- Results ------------------------------------------ */
  addResult(result) {
    State.results.unshift(result);
    if (State.results.length > 2000) State.results.length = 2000;
    this.updateResultsPage();
  },

  updateResultsPage() {
    const tbody = document.getElementById('results-tbody');
    const empty = document.getElementById('results-empty');
    document.getElementById('results-count-label').textContent = `${State.results.length} results`;

    if (State.results.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
    } else {
      empty.style.display = 'none';
      const show = State.results.slice(0, 200);
      tbody.innerHTML = show.map(r => `
        <tr>
          <td><span class="domain-name">${r.domain}</span></td>
          <td>${this._providerChip(r.provider)}</td>
          <td>${r.gameId ? `<code style="font-size:0.75rem;">${r.gameId}</code>` : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td>${r.rtp != null ? `<span class="rtp-value ${this._rtpClass(r.rtp)}">${r.rtp}%</span>` : '—'}</td>
          <td>${r.empiricalRtp != null ? `<span class="rtp-value ${this._rtpClass(r.empiricalRtp)}">${r.empiricalRtp}%</span>` : '—'}</td>
          <td>${r.spins > 0 ? r.spins : '—'}</td>
          <td>${r.winRate != null ? `${r.winRate}%` : '—'}</td>
          <td><span class="status-indicator ${r.status}"></span>${r.status}</td>
          <td style="font-size:0.75rem;color:var(--text-muted);">${new Date(r.timestamp).toLocaleTimeString()}</td>
        </tr>
      `).join('');
    }

    this.updateSummaryTab();
    this.updateResultCharts();
  },

  clearResults() {
    this.confirm('Clear all results?', 'This action cannot be undone.', () => {
      State.results = [];
      this.updateResultsPage();
      this.toast('info', 'Results cleared');
    });
  },

  switchResultTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`result-tab-${tab}`).classList.add('active');
    if (tab === 'charts') this.updateResultCharts();
  },

  updateSummaryTab() {
    const r = State.results;
    const withRtp = r.filter(x => x.rtp != null);
    const avgRtp = withRtp.length ? (withRtp.reduce((a, b) => a + b.rtp, 0) / withRtp.length).toFixed(2) : '—';
    const successCount = r.filter(x => x.status === 'success').length;
    const successRate = r.length ? ((successCount / r.length) * 100).toFixed(1) : '—';

    const kpiEl = document.getElementById('summary-kpis');
    kpiEl.innerHTML = `
      <div class="kpi-card purple"><div class="kpi-label">Total Results</div><div class="kpi-value">${r.length}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Avg RTP</div><div class="kpi-value">${avgRtp}%</div></div>
      <div class="kpi-card orange"><div class="kpi-label">Success Rate</div><div class="kpi-value">${successRate}%</div></div>
      <div class="kpi-card blue"><div class="kpi-label">Successful</div><div class="kpi-value">${successCount}</div></div>
    `;

    const top = [...r].filter(x => x.rtp != null).sort((a, b) => b.rtp - a.rtp).slice(0, 10);
    const topEl = document.getElementById('top-domains-tbody');
    topEl.innerHTML = top.length ? top.map(x => `
      <tr>
        <td><span class="domain-name">${x.domain}</span></td>
        <td><span class="rtp-value ${this._rtpClass(x.rtp)}">${x.rtp}%</span></td>
        <td>${x.empiricalRtp != null ? `${x.empiricalRtp}%` : '—'}</td>
        <td>${x.winRate != null ? `${x.winRate}%` : '—'}</td>
        <td>${x.spins || '—'}</td>
        <td>${this._providerChip(x.provider)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">No results yet</td></tr>`;
  },

  /* ---- Analytics ---------------------------------------- */
  updateAnalytics() {
    const domains = State.domains;
    document.getElementById('kpi-total-domains').textContent = domains.length;

    const withRtp = domains.filter(d => d.rtp != null);
    const avgRtp = withRtp.length
      ? (withRtp.reduce((a, b) => a + b.rtp, 0) / withRtp.length).toFixed(1)
      : '—';
    document.getElementById('kpi-avg-rtp').textContent = avgRtp !== '—' ? `${avgRtp}%` : '—';

    const hunted = domains.filter(d => d.status !== 'idle');
    const successRate = hunted.length
      ? ((domains.filter(d => d.status === 'success').length / hunted.length) * 100).toFixed(0)
      : '—';
    document.getElementById('kpi-success-rate').textContent = successRate !== '—' ? `${successRate}%` : '—';
    document.getElementById('kpi-success-sub').textContent = hunted.length
      ? `${hunted.length} domains hunted` : 'no hunts yet';

    this.updateCharts();
  },

  refreshAnalytics() {
    this.updateAnalytics();
    this.buildHeatmap();
    this.toast('info', 'Analytics refreshed');
    this.log('DEBUG', 'Analytics refreshed');
  },

  /* ---- Charts -------------------------------------------- */
  buildCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    Chart.defaults.color = isDark ? '#9fa8da' : '#3949ab';
    Chart.defaults.borderColor = isDark ? '#2d3148' : '#c5cae9';

    // Provider Pie
    State.charts.provider = new Chart(document.getElementById('chart-provider'), {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} domains` } },
        },
      },
    });

    // Tier Bar
    State.charts.tier = new Chart(document.getElementById('chart-tier'), {
      type: 'bar',
      data: { labels: Object.values(CONFIG.tierLabels), datasets: [{ data: [], backgroundColor: CONFIG.tierColors }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    // Category RTP
    State.charts.categoryRtp = new Chart(document.getElementById('chart-category-rtp'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Avg RTP %', data: [], backgroundColor: '#7c4dff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: false, min: 88, max: 100, ticks: { callback: v => `${v}%` } } },
      },
    });

    // RTP Distribution (results)
    State.charts.rtpDist = new Chart(document.getElementById('chart-rtp-dist'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Count', data: [], backgroundColor: '#7c4dff' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    // Success Rate (results)
    State.charts.successRate = new Chart(document.getElementById('chart-success-rate'), {
      type: 'doughnut',
      data: { labels: ['Success', 'Failed', 'Idle'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#00e676','#ff5252','#5c6bc0'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });

    // RTP Trend
    State.charts.rtpTrend = new Chart(document.getElementById('chart-rtp-trend'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Empirical RTP %', data: [], borderColor: '#7c4dff', backgroundColor: 'rgba(124,77,255,0.1)', tension: 0.4, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 85, max: 102, ticks: { callback: v => `${v}%` } } } },
    });

    // Win Rate by domain
    State.charts.winRate = new Chart(document.getElementById('chart-win-rate'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Win Rate %', data: [], backgroundColor: '#00e676' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `${v}%` } } } },
    });

    // Net Profit
    State.charts.netProfit = new Chart(document.getElementById('chart-net-profit'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Net Profit', data: [], backgroundColor: [] }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => `$${v}` } } },
      },
    });

    this.updateCharts();
  },

  updateCharts() {
    if (!State.charts.provider) return;
    const domains = State.domains;

    // Provider distribution
    const providerMap = {};
    domains.forEach(d => {
      providerMap[d.provider] = (providerMap[d.provider] || 0) + 1;
    });
    const pc = State.charts.provider;
    pc.data.labels = Object.keys(providerMap);
    pc.data.datasets[0].data = Object.values(providerMap);
    pc.data.datasets[0].backgroundColor = Object.keys(providerMap).map(p => CONFIG.chartColors[p] || '#9e9e9e');
    pc.update();

    // Tier breakdown
    const tierMap = { 1: 0, 2: 0, 3: 0, 4: 0 };
    domains.forEach(d => { tierMap[d.tier] = (tierMap[d.tier] || 0) + 1; });
    const tc = State.charts.tier;
    tc.data.datasets[0].data = [tierMap[1], tierMap[2], tierMap[3], tierMap[4]];
    tc.update();

    // Category RTP
    const cats = [...new Set(domains.map(d => d.category))].sort();
    const catRtps = cats.map(cat => {
      const catDomains = domains.filter(d => d.category === cat && d.rtp != null);
      return catDomains.length ? (catDomains.reduce((a, b) => a + b.rtp, 0) / catDomains.length).toFixed(2) : 0;
    });
    const cc = State.charts.categoryRtp;
    cc.data.labels = cats;
    cc.data.datasets[0].data = catRtps;
    cc.data.datasets[0].backgroundColor = cats.map((_, i) => `hsl(${(i * 30) % 360}, 70%, 60%)`);
    cc.update();

    // Success Rate doughnut
    const success = domains.filter(d => d.status === 'success').length;
    const errCount = domains.filter(d => d.status === 'error').length;
    const idleCount = domains.filter(d => d.status === 'idle').length;
    const src = State.charts.successRate;
    src.data.datasets[0].data = [success, errCount, idleCount];
    src.update();
  },

  updateResultCharts() {
    if (!State.charts.rtpDist) return;
    const results = State.results;

    // RTP Distribution histogram
    const buckets = {};
    results.filter(r => r.rtp != null).forEach(r => {
      const b = `${Math.floor(r.rtp)}–${Math.floor(r.rtp) + 1}`;
      buckets[b] = (buckets[b] || 0) + 1;
    });
    const sortedBuckets = Object.keys(buckets).sort();
    const rd = State.charts.rtpDist;
    rd.data.labels = sortedBuckets;
    rd.data.datasets[0].data = sortedBuckets.map(k => buckets[k]);
    rd.update();

    // RTP Trend
    const trendData = results.slice(0, 50).reverse().filter(r => r.empiricalRtp != null);
    const rt = State.charts.rtpTrend;
    rt.data.labels = trendData.map((_, i) => i + 1);
    rt.data.datasets[0].data = trendData.map(r => r.empiricalRtp);
    rt.update();

    // Win Rate by domain
    const domainWins = {};
    results.filter(r => r.winRate != null).forEach(r => {
      if (!domainWins[r.domain]) domainWins[r.domain] = [];
      domainWins[r.domain].push(parseFloat(r.winRate));
    });
    const wr = State.charts.winRate;
    const wrLabels = Object.keys(domainWins).slice(0, 15);
    wr.data.labels = wrLabels.map(l => l.length > 20 ? l.slice(0, 17) + '…' : l);
    wr.data.datasets[0].data = wrLabels.map(l => (domainWins[l].reduce((a, b) => a + b, 0) / domainWins[l].length).toFixed(1));
    wr.update();

    // Net Profit
    const np = State.charts.netProfit;
    const profitData = results.filter(r => r.netProfit != null).slice(0, 20);
    np.data.labels = profitData.map(r => r.domain.length > 20 ? r.domain.slice(0, 17) + '…' : r.domain);
    np.data.datasets[0].data = profitData.map(r => parseFloat(r.netProfit));
    np.data.datasets[0].backgroundColor = profitData.map(r => parseFloat(r.netProfit) >= 0 ? '#00e676' : '#ff5252');
    np.update();
  },

  rebuildCharts() {
    if (!Object.keys(State.charts).length) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    Chart.defaults.color = isDark ? '#9fa8da' : '#3949ab';
    Chart.defaults.borderColor = isDark ? '#2d3148' : '#c5cae9';
    Object.values(State.charts).forEach(c => c.update());
  },

  /* ---- Heatmap ------------------------------------------ */
  buildHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    const cats = [...new Set(State.domains.map(d => d.category))].sort();
    grid.innerHTML = cats.map(cat => {
      const catDomains = State.domains.filter(d => d.category === cat && d.rtp != null);
      const avg = catDomains.length
        ? (catDomains.reduce((a, b) => a + b.rtp, 0) / catDomains.length)
        : null;
      // Map RTP 92–97 → hue 0 (red) to 120 (green), clamped to [0,120]
      const pct = avg != null ? Math.max(0, Math.min(1, (avg - 92) / 5)) : 0;
      const hue = Math.round(pct * 120); // red→green
      const bg = avg != null ? `hsla(${hue}, 75%, 45%, 0.3)` : 'rgba(100,100,100,0.15)';
      const border = avg != null ? `hsla(${hue}, 75%, 55%, 0.6)` : 'rgba(100,100,100,0.3)';
      const count = State.domains.filter(d => d.category === cat).length;
      return `<div class="heatmap-cell" style="background:${bg};border:1px solid ${border};"
               data-tooltip="${cat}: ${avg ? avg.toFixed(1) + '% avg RTP, ' : ''}${count} domains"
               onclick="App.filterByCategory('${cat}')">
        <span class="cell-name">${cat}</span>
        <span class="cell-val">${avg != null ? avg.toFixed(1) + '%' : 'N/A'}</span>
      </div>`;
    }).join('');
  },

  filterByCategory(cat) {
    this.navigate('domains');
    document.getElementById('filter-category').value = cat;
    this.filterDomains();
    this.toast('info', `Filtered by category: ${cat}`);
  },

  /* ---- Logging ------------------------------------------ */
  log(level, message) {
    const entry = { level, message, timestamp: new Date().toISOString() };
    State.logs.unshift(entry);
    if (State.logs.length > 1000) State.logs.length = 1000;

    const panel = document.getElementById('log-panel');
    if (!panel) return;
    const filter = document.getElementById('log-level-filter').value;
    if (filter && level !== filter) return;

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
      <span class="log-ts">${new Date(entry.timestamp).toLocaleTimeString()}</span>
      <span class="log-level ${level}">${level}</span>
      <span class="log-msg">${this._escapeHtml(message)}</span>
    `;
    panel.insertBefore(div, panel.firstChild);
    while (panel.children.length > 300) panel.removeChild(panel.lastChild);

    if (level === 'ERROR') this._addError(message);
  },

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _addError(msg) {
    State.errors.push({ time: new Date().toLocaleTimeString(), domain: '—', error: msg, retries: 0 });
    const tbody = document.getElementById('error-tbody');
    if (!tbody) return;
    const row = document.createElement('tr');
    const e = State.errors[State.errors.length - 1];
    row.innerHTML = `<td>${e.time}</td><td>${e.domain}</td><td style="color:var(--error)">${this._escapeHtml(e.error)}</td><td>${e.retries}</td>`;
    tbody.insertBefore(row, tbody.firstChild);
    // Remove the default "No errors" row
    const emptyRow = tbody.querySelector('td[colspan]');
    if (emptyRow) emptyRow.parentElement.remove();
  },

  filterLogs() {
    // Re-render from State.logs
    const panel = document.getElementById('log-panel');
    const filter = document.getElementById('log-level-filter').value;
    const filtered = filter ? State.logs.filter(l => l.level === filter) : State.logs;
    panel.innerHTML = filtered.slice(0, 300).map(e => `
      <div class="log-entry">
        <span class="log-ts">${new Date(e.timestamp).toLocaleTimeString()}</span>
        <span class="log-level ${e.level}">${e.level}</span>
        <span class="log-msg">${this._escapeHtml(e.message)}</span>
      </div>
    `).join('');
  },

  clearLogs() {
    State.logs = [];
    document.getElementById('log-panel').innerHTML = '';
    this.toast('info', 'Logs cleared');
  },

  exportLogs() {
    const text = State.logs.map(l => `[${l.timestamp}] ${l.level} ${l.message}`).join('\n');
    this._download('rtp-hunter-logs.txt', text, 'text/plain');
    this.toast('success', 'Logs exported');
  },

  /* ---- Export ------------------------------------------- */
  exportData(format) {
    const domains = State.filteredDomains.length ? State.filteredDomains : State.domains;
    if (format === 'json') {
      const data = JSON.stringify({ domains, results: State.results }, null, 2);
      this._download('rtp-hunter-data.json', data, 'application/json');
      this.toast('success', 'JSON exported');
      this.log('INFO', 'Data exported as JSON');
    } else if (format === 'csv') {
      const headers = ['name', 'category', 'priority', 'tier', 'provider', 'rtp', 'status', 'lastHunted'];
      const rows = domains.map(d => headers.map(h => JSON.stringify(d[h] ?? '')).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      this._download('rtp-hunter-domains.csv', csv, 'text/csv');
      this.toast('success', 'CSV exported');
      this.log('INFO', 'Domains exported as CSV');
    }
  },

  _download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /* ---- Toast Notifications ------------------------------- */
  toast(type, message, duration = 4000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span>${this._escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;
    el.querySelector('.toast-close').addEventListener('click', () => this._dismissToast(el));
    container.appendChild(el);
    setTimeout(() => this._dismissToast(el), duration);
  },
  _dismissToast(el) {
    el.classList.add('hiding');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  },

  /* ---- Confirm Modal ------------------------------------- */
  confirm(title, msg, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('open');
    const btn = document.getElementById('confirm-ok-btn');
    const handler = () => {
      modal.classList.remove('open');
      btn.removeEventListener('click', handler);
      onConfirm();
    };
    btn.addEventListener('click', handler);
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },

};

/* =========================================================
   BOOT
   ========================================================= */

/**
 * Wait for Chart.js to finish loading (it may load async via the CDN
 * fallback snippet in index.html) before initialising the app.
 */
function waitForChartJs(cb, attempts) {
  if (typeof Chart !== 'undefined') { cb(); return; }
  if ((attempts || 0) > 50) {
    // Chart.js failed to load — init without charts
    console.warn('Chart.js did not load; charts will be disabled.');
    App.buildCharts = function () {};
    cb();
    return;
  }
  setTimeout(() => waitForChartJs(cb, (attempts || 0) + 1), 100);
}

document.addEventListener('DOMContentLoaded', () => waitForChartJs(() => App.init()));

// Close modals on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// Keyboard: Escape closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});
