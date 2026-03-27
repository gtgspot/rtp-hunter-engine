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
        this._dirty = false;
    }

    addDomain(name, priority, metadata) {
        const domain = new Domain(name, priority, metadata);
        this.domains.push(domain);
        this._dirty = true;
    }

    organizeDomains() {
        this.domains.sort((a, b) => b.priority - a.priority);
        this._dirty = false;
    }

    queryDomains(criteria) {
        return this.domains.filter(domain => {
            return Object.keys(criteria).every(key => {
                return domain.metadata[key] === criteria[key];
            });
        });
    }

    getDomains() {
        if (this._dirty) {
            this.organizeDomains();
        }
        return this.domains;
    }
}

export { Domain, DomainManager };
