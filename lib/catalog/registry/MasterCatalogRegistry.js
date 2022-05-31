import ProductsRegistry from './ProductsRegistry.js';
import { log } from '../../tools/logger.js';

/**
 * @extends {ProductsRegistry<{ dependencies: Record<string, string> }>}
 */
export default class MasterCatalogRegistry extends ProductsRegistry {
    /**
     * @param {string} dataFolder
     * @param {string} name
     */
    constructor (dataFolder, name) {
        super(dataFolder, ['dependencies']);
        this.name = name;
    }

    /**
     * @override
     */
    get cachePrefix () {
        return this.name + '_';
    }

    /**
     * @param {string} id
     * @param {import('#types').ProductType} type
     * @param {Array<string>} dependencies
     */
    addProduct (id, type, dependencies) {
        if (!this.cache.products[id]) {
            this.cache.products[id] = {
                type, dependencies
            };

            this.registerDependencies(dependencies);
        }
    }

    /**
     * @param {Array<string>} dependencies
     */
    registerDependencies (dependencies) {
        dependencies.forEach(depId => {
            if (!this.cache.dependencies[depId]) {
                this.cache.dependencies[depId] = depId;
            }
        });
    }

    writeCache () {
        this.removeRedundantDependencies();

        super.writeCache();
    }

    removeRedundantDependencies () {
        for (const pid in this.cache.dependencies) {
            if (!this.cache.products[pid]) {
                log(`Dependency ${pid} doesn't exist.`);

                delete this.cache.products[pid];
                delete this.cache.dependencies[pid];
            }
        }
    }

    /**
     * @param {string} pid
     */
    isDependency (pid) {
        return pid in this.cache.dependencies;
    }

    /**
     * @param {Array<MasterCatalogRegistry['cache']['products']>} productCacheArray
     */
    appendProducts(productCacheArray) {
        productCacheArray.forEach(products => {
            Object.keys(products).forEach(productID => {
                const productToAppend = products[productID];

                this.cache.products[productID] = this.cache.products[productID] || {
                    type: productToAppend.type,
                    dependencies: []
                };

                productToAppend.dependencies.forEach(dep => {
                    if (!this.cache.products[productID].dependencies.includes(dep)) {
                        this.cache.products[productID].dependencies.push(dep);
                    }
                })
            })
        });
    }
};
