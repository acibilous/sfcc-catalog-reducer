const Types = require('../../types');

const ProductsRegistry = require('./ProductsRegistry');
const { log } = require('../../tools/logger');

/**
 * @extends {ProductsRegistry<{ dependencies: Record<string, string> }>}
 */
module.exports = class MasterCatalogRegistry extends ProductsRegistry {
    /**
     * @param {string} dataFolder
     */
    constructor (dataFolder) {
        super(dataFolder, ['dependencies']);
    }

    /**
     * @override
     */
    get cachePrefix () {
        return 'master_';
    }

    /**
     * @param {string} id
     * @param {Types.ProductType} type
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
};
