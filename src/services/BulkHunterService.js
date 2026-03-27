class BulkHunterService {
    constructor(huntingFunction) {
        this.huntingFunction = huntingFunction;
    }

    async processDomains(domains, options) {
        const { concurrencyLimit = 5, rateLimit = 1000 } = options;
        const results = [];
        const errors = [];
        const progress = {
            total: domains.length,
            completed: 0,
        };

        const rateLimiter = this.createRateLimiter(rateLimit);

        const promises = domains.map(async (domain) => {
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

        // Limit concurrency
        await this.concurrentLimit(promises, concurrencyLimit);

        return { results, errors };
    }

    createRateLimiter(rateLimit) {
        let lastExecution = 0;
        return async () => {
            const now = Date.now();
            const waitTime = Math.max(rateLimit - (now - lastExecution), 0);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            lastExecution = Date.now();
        };
    }

    async concurrentLimit(promises, limit) {
        let index = 0;
        const executing = new Set();

        const enqueue = async () => {
            if (index >= promises.length) return;
            const promise = promises[index++];
            executing.add(promise);
            promise.then(() => executing.delete(promise));
            return promise;
        };

        const results = [];  
        while (index < promises.length) {
            if (executing.size < limit) {
                results.push(enqueue());
            }
            await Promise.race(results);
        }
        await Promise.all(results);
    }

    logProgress(progress) {
        console.log(`Completed ${progress.completed} out of ${progress.total} domains.`);
    }
}

module.exports = BulkHunterService;
