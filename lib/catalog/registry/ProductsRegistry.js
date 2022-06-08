import Registry from './Registry.js';

/**
 * @template {Record<string, object>} Cache
 * @extends {Registry<Cache & { products: Record<string, import('#types').Product> }>}
 */
export default class ProductsRegistry extends Registry {
    /**
     * @param {string} dataFolder
     * @param {Array<keyof Cache>} cacheFiles
     * @param {string} name
     */
    constructor(dataFolder, cacheFiles, name) {
        super(dataFolder, ['products', ...cacheFiles], name);
    }

    /**
     * @param {string} id - product id
     * @returns {import('#types').Product}
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
