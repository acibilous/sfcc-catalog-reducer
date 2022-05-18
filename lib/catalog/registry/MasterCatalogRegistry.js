const Types = require('../../types');
const CatalogRegistry = require('./CatalogRegistry');
const { log } = require('../../tools/logger');

module.exports = class MasterCatalogRegistry extends CatalogRegistry {
    constructor (dataFolder) {
        super(dataFolder);
        this.dependencies = {};
    }

    get fileprefix () {
        return super.fileprefix + 'master_';
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
     * @param {string} id
     * @param {Types.ProductType} type
     * @param {Array<string>} dependencies
     */
    updateProduct (id, type, dependencies) {
        this.products[id] = {
            type, dependencies
        };

        this.updateDependencies(dependencies);
    }

    /**
     * @param {Array<string>} dependencies
     */
    registerDependencies (dependencies) {
        dependencies.forEach(depId => (this.dependencies[depId] ? '' : this.dependencies[depId] = depId));
    }

    /**
     * @param {Array<string>} dependencies
     */
    updateDependencies (dependencies) {
        dependencies.forEach(depId => {
            this.dependencies[depId] = depId;
        });
    }

    writeCache () {
        this.checkDependenciesExisting();
        super.writeCache();
        this.writeJSONFile(this.fileprefix + 'dependencies.json', this.dependencies);
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
        return !!this.dependencies[pid];
    }
};
