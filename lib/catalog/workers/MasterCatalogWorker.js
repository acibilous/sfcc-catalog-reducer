import Types from '../../types.js';
import CatalogWorker from './CatalogWorker.js';
import MasterCatalogRegistry from '../registry/MasterCatalogRegistry.js';
const DEPENDENCY_REGEX = /product-id="(.+?)"/g;

/**
 * @param {RegExp} regex
 * @param {string} str
 * @param {Array<RegExpExecArray>} matches
 * @returns {Array<RegExpExecArray>}
 */
function findMatches(regex, str, matches = []) {
    const res = regex.exec(str);

    res && matches.push(res) && findMatches(regex, str, matches);

    return matches;
}

/**
 * @extends {CatalogWorker<MasterCatalogRegistry>}
 */
export default class MasterCatalogWorker extends CatalogWorker {
    /**
     * @param {string} filePath
     */
    constructor (filePath) {
        super(filePath, MasterCatalogRegistry);
    }

    /**
     * @override
     */
    get parsingTag () {
        return 'product';
    }

    initEvents () {
        super.initEvents();

        this.on('match', (/** @type {Types.XMLTag} */ tagData, /** @type {string} */ raw) => {
            const id = tagData.attributes['product-id'];
            const type = this.getProductTypeByRaw(raw);
            const dependencies = type !== 'standard' ? this.getDependenciesFromRaw(raw) : [];

            this.registry.addProduct(id, type, dependencies);
        });
    }

    /**
     * @param {string} raw
     */
    getDependenciesFromRaw (raw) {
        const dependencies = findMatches(DEPENDENCY_REGEX, raw).map(el => el[1]);

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
