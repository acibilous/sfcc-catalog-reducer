const Types = require('../../types');

const CatalogWorker = require('./CatalogWorker');
const MasterCatalogRegistry = require('../registry/MasterCatalogRegistry');
const DEPENDENCY_REGEX = /product-id="(.+?)"/g;

function findMatches(regex, str, matches = []) {
    const res = regex.exec(str);

    res && matches.push(res) && findMatches(regex, str, matches);

    return matches;
}

module.exports = class MasterCatalogWorker extends CatalogWorker {
    constructor (filepath) {
        super(filepath);

        this.registry = new MasterCatalogRegistry(this.folder);
        this.initEvents();
    }

    get parsingTag () {
        return 'product';
    }

    initEvents () {
        this.on('match', (tagData, raw) => {
            const id = tagData.attributes['product-id'];
            const type = this.getProductTypeByRaw(raw);
            const dependencies = type !== 'standard' ? this.getDependenciesFromRaw(raw) : [];

            this.registry.addProduct(id, type, dependencies);
        })
            .on('end', () => this.registry.writeCache());
    }

    getDependenciesFromRaw (raw) {
        const dependencies = findMatches(DEPENDENCY_REGEX, raw, []).map(el => el[1]);

        dependencies.shift();

        return dependencies;
    }

    /**
     * @param {string} raw
     * @returns {Types.ProductType}
     */
    getProductTypeByRaw (raw) {
        let type = 'standard';

        if (raw.includes('bundled-products>')) {
            type = 'bundle';
        } else if (raw.includes('product-set-products>')) {
            type = 'set';
        } else if (raw.includes('variations>')) {
            type = 'master';
        }

        return type;
    }
};
