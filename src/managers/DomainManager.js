class Domain {
    constructor(name, priority, metadata = {}) {
        this.name = name;
        this.priority = priority;
        this.metadata = metadata;
    }
}

class DomainManager {
    constructor() {
        this.domains = [];
    }

    addDomain(name, priority, metadata) {
        const domain = new Domain(name, priority, metadata);
        this.domains.push(domain);
        this.organizeDomains();
    }

    organizeDomains() {
        this.domains.sort((a, b) => b.priority - a.priority);
    }

    queryDomains(criteria) {
        return this.domains.filter(domain => {
            return Object.keys(criteria).every(key => {
                return domain.metadata[key] === criteria[key];
            });
        });
    }

    getDomains() {
        return this.domains;
    }
}

// Example usage
const domainManager = new DomainManager();
domainManager.addDomain('example.com', 1, { owner: 'Alice', registered: '2020-01-01' });
domainManager.addDomain('example.org', 2, { owner: 'Bob', registered: '2021-01-01' });

console.log(domainManager.getDomains());
console.log(domainManager.queryDomains({ owner: 'Alice' }));