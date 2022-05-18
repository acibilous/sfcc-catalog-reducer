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

        this.allVariationGroupIDs = [];
        this.allStandardProductDefinitions= {};
    }

    get parsingTag () {
        return 'product';
    }

    initEvents () {
        this.on('match', (tagData, raw) => {
            const id = tagData.attributes['product-id'];
            const type = this.getNonVGProductTypeByRaw(raw);
            const dependencies = type !== 'standard' ? this.getDependenciesFromRaw(raw) : [];

            if (type === 'standard') {
                this.allStandardProductDefinitions[id] = raw;
            }

            if (type === 'master') {
                const variationGroups = this.getVariationGroupIDs(raw);

                this.allVariationGroupIDs.push(...variationGroups);
            }

            this.registry.addProduct(id, type, dependencies);
        })
            .on('end', () => {
                this.allVariationGroupIDs.forEach(id => {
                    const raw = this.allStandardProductDefinitions[id];

                    const dependencies = this.getDependenciesFromRaw(raw);

                    this.registry.updateProduct(id, 'variation-group', dependencies);
                });

                this.allStandardProductDefinitions = {};

                this.registry.writeCache();
            });
    }

    /**
     * @param {string} rawMaster
     * @returns {Array<string>}
     */
    getVariationGroupIDs (rawMaster) {
        const start = rawMaster.indexOf('<variation-groups>');

        if (start === -1) {
            return [];
        }

        const end = rawMaster.indexOf('</variation-groups>');

        const vgString = rawMaster.substring(start, end);

        const [, ...stringWithIDs] = vgString.split('product-id="');

        const IDs = stringWithIDs.map(str => str.substring(0, str.indexOf('"')));

        return IDs;
    }

    getDependenciesFromRaw (raw) {
        const dependencies = findMatches(DEPENDENCY_REGEX, raw, []).map(el => el[1]);

        dependencies.shift();

        return dependencies;
    }

    /**
     * @param {string} raw
     * @returns {Types.NonVGProductType}
     */
    getNonVGProductTypeByRaw (raw) {
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
