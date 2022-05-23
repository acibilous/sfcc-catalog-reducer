const Types = require('../../types');

const ProductsRegistry = require('./ProductsRegistry');
const { log } = require('../../tools/logger');

module.exports = class MasterCatalogRegistry extends ProductsRegistry {
    /**
     * @param {string} dataFolder
     */
    constructor (dataFolder) {
        super(dataFolder);

        /**
         * @type {Record<string, string>}
         */
        this.dependencies = {};
    }

    get filePrefix () {
        return super.filePrefix + 'master_';
    }

    /**
     * @param {string} id
     * @param {Types.ProductType} type
     * @param {Array<string>} dependencies
     */
    addProduct (id, type, dependencies) {
        if (!this.products[id]) {
            this.products[id] = {
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
            if (!this.dependencies[depId]) {
                this.dependencies[depId] = depId;
            }
        });
    }

    writeCache () {
        this.checkDependenciesExisting();
        super.writeCache();
        this.writeJSONFile(this.filePrefix + 'dependencies.json', this.dependencies);
    }

    checkDependenciesExisting () {
        for (const pid in this.dependencies) {
            if (!this.products[pid]) {
                log(`Dependency ${pid} doesn't exist.`);
                delete this.products[pid];
                delete this.dependencies[pid];
            }
        }
    }

    /**
     * @param {string} pid
     */
    isDependency (pid) {
        return pid in this.dependencies;
    }
};
