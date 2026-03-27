import { chromium } from "playwright";

class SpinSimulationEngine {
    constructor(options = {}) {
        this.spins = [];
        this.totalBet = 0;
        this.totalReturn = 0;
        this.browser = null;
        this.page = null;
        this.apiInterceptor = [];
        this.config = {
            timeout: options.timeout || 15000,
            headless: options.headless !== false,
            ...options,
        };
    }

    async initialize(domain) {
        this.browser = await chromium.launch({ headless: this.config.headless });
        this.page = await this.browser.newPage();
        await this.page.route("**/api/**", (route) => {
            const request = route.request();
            const url = request.url();
            const method = request.method();
            if (url.includes("spin") || url.includes("play")) {
                this.apiInterceptor.push({
                    type: "request",
                    url,
                    method,
                    timestamp: Date.now(),
                });
            }
            route.continue();
        });
        this.page.on("response", async (response) => {
            const url = response.url();
            if ((url.includes("spin") || url.includes("play")) && response.status() === 200) {
                try {
                    const json = await response.json();
                    this.apiInterceptor.push({
                        type: "response",
                        url,
                        data: json,
                        timestamp: Date.now(),
                    });
                } catch (e) {}
            }
        });
        await this.page.goto(`https://${domain}`, { timeout: this.config.timeout, waitUntil: "networkidle", });
        return this;
    }

    extractSpinData(apiResponse) {
        const data = apiResponse.data;
        const bet = data.bet || data.stake || data.wager || 0;
        const win = data.win || data.payout || data.return || 0;
        const result = data.result || data.outcome || {};
        return {
            bet: parseFloat(bet),
            win: parseFloat(win),
            result,
            timestamp: apiResponse.timestamp,
        };
    }

    async simulateSpins(count = 100, betAmount = 1.0) {
        const spinResults = [];
        for (let i = 0; i < count; i++) {
            const startLength = this.apiInterceptor.length;
            try {
                await this.page.click("button:has-text('Spin'), button[class*=spin]");
            } catch (e) {
                await this.page.evaluate(() => {
                    const buttons = document.querySelectorAll("button");
                    const spinBtn = Array.from(buttons).find((b) => b.textContent.toLowerCase().includes("spin") || b.className.toLowerCase().includes("spin"));
                    if (spinBtn) spinBtn.click();
                });
            }
            await this.page.waitForTimeout(2000);
            const newApiCalls = this.apiInterceptor.slice(startLength);
            const spinResponse = newApiCalls.find((call) => call.type === "response");
            if (spinResponse) {
                const spinData = this.extractSpinData(spinResponse);
                spinResults.push(spinData);
                this.totalBet += betAmount;
                this.totalReturn += spinData.win;
                this.spins.push(spinData);
            }
            console.log(`Spin ${i + 1}/${count} - Bet: ${betAmount}, Win: ${spinResults[spinResults.length - 1]?.win || 0}`);
        }
        return spinResults;
    }

    calculateRTP() {
        if (this.totalBet === 0) {
            return 0;
        }
        const empiricalRTP = (this.totalReturn / this.totalBet) * 100;
        return parseFloat(empiricalRTP.toFixed(2));
    }

    generateReport() {
        const rtp = this.calculateRTP();
        const totalSpins = this.spins.length;
        const winningSpins = this.spins.filter((s) => s.win > 0).length;
        const winRate = totalSpins > 0 ? (winningSpins / totalSpins) * 100 : 0;
        const avgWin = winningSpins > 0 ? this.totalReturn / winningSpins : 0;
        const maxWin = Math.max(...this.spins.map((s) => s.win), 0);
        const minWin = Math.min(...this.spins.map((s) => s.win), 0);
        return {
            empiricalRTP: rtp,
            totalSpins,
            totalBet: this.totalBet.toFixed(2),
            totalReturn: this.totalReturn.toFixed(2),
            winningSpins,
            winRate: winRate.toFixed(2),
            avgWin: avgWin.toFixed(2),
            maxWin,
            minWin,
            netProfit: (this.totalReturn - this.totalBet).toFixed(2),
            timestamp: new Date().toISOString(),
        };
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export async function runSpinSimulation(domain, spinCount = 100, options = {}) {
    const engine = new SpinSimulationEngine({ headless: true, timeout: 30000, });
    try {
        console.log(`🎰 Initializing Spin Simulation Engine for ${domain}`);
        await engine.initialize(domain);
        console.log(`🎮 Simulating ${spinCount} spins...`);
        await engine.simulateSpins(spinCount, options.betAmount ?? 1.0);
        const report = engine.generateReport();
        console.log("📊 Spin Simulation Report:", report);
        return report;
    } catch (error) {
        console.error("❌ Spin Simulation Error:", error);
        throw error;
    } finally {
        await engine.close();
    }
}

export { SpinSimulationEngine };