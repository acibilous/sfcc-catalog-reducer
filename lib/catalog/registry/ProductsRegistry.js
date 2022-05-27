import Types from '../../types.js';
import Registry from './Registry.js';

/**
 * @template {Record<string, object>} Cache
 * @extends {Registry<Cache & { products: Record<string, Types.Product> }>}
 */
export default class ProductsRegistry extends Registry {
    /**
     * @param {string} dataFolder
     * @param {Array<keyof Cache>} cacheFiles
     */
    constructor(dataFolder, cacheFiles) {
        super(dataFolder, ['products', ...cacheFiles]);
    }

    /**
     * @param {string} id - product id
     * @returns {Types.Product}
     */
    getOrCreateProduct (id) {
        let instance = this.cache.products[id];

        if (!instance) {
            instance = {};
        }

        return instance;
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    hasProduct (id) {
        return id in this.products;
    }
};
