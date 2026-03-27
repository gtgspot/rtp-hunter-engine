class BulkHunterService {
    constructor(huntingFunction) {
        this.huntingFunction = huntingFunction;
    }

    async processDomains(domains, options = {}) {
        const { concurrencyLimit = 5, rateLimit = 1000 } = options;
        const results = [];
        const errors = [];
        const progress = {
            total: domains.length,
            completed: 0,
        };

        const rateLimiter = this.createRateLimiter(rateLimit);

        // Build lazy task factories — no work starts until a slot is available
        const tasks = domains.map(domain => async () => {
            await rateLimiter();
            try {
                const result = await this.huntingFunction(domain);
                results.push(result);
            } catch (error) {
                errors.push({ domain, error });
            } finally {
                progress.completed++;
                this.logProgress(progress);
            }
        });

        await this.concurrentPool(tasks, concurrencyLimit);

        return { results, errors };
    }

    createRateLimiter(rateLimit) {
        let lastExecution = 0;
        return async () => {
            const now = Date.now();
            const waitTime = Math.max(rateLimit - (now - lastExecution), 0);
            lastExecution = now + waitTime;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        };
    }

    async concurrentPool(tasks, limit) {
        let index = 0;

        const runNext = async () => {
            if (index >= tasks.length) return;
            const task = tasks[index++];
            await task();
            await runNext();
        };

        const workers = Array.from({ length: Math.min(limit, tasks.length) }, runNext);
        await Promise.all(workers);
    }

    logProgress(progress) {
        console.log(`Completed ${progress.completed} out of ${progress.total} domains.`);
    }
}

export default BulkHunterService;
