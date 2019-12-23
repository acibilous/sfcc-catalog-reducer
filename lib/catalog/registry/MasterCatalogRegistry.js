const CatalogRegistry = require('./CatalogRegistry'), { log } = require('../../tools/logger');

module.exports = class MasterCatalogRegistry extends CatalogRegistry {
    constructor (dataFolder) {
        super(dataFolder);
        this.dependencies = {};
    }

    get fileprefix () {
        return super.fileprefix + 'master_';
    }
    /**
     * 
     * @param {String} id 
     * @param {String} type 
     * @param {Array<String>} dependencies 
     */
    addProduct (id, type, dependencies) {
        if (!this.products[id]) {
            this.products[id] = {
                type, dependencies
            }

            this.registerDependencies(dependencies);
        }
    }

    /**
     * 
     * @param {Array<String>} dependencies 
     */
    registerDependencies (dependencies) {
        dependencies.forEach(depId => this.dependencies[depId] ? '' : this.dependencies[depId] = depId);
    }

    writeCache () {
        this.checkDependenciesExisting();
        super.writeCache();
        this.writeJSONFile(this.fileprefix + 'dependencies.json', this.dependencies);
    }

    checkDependenciesExisting () {
        for (let pid in this.dependencies) {
            if (!this.products[pid]) {
                log(`Dependency ${pid} doesn't exist.`);
                delete this.products[pid];
                delete this.dependencies[pid];
            }
        }
    }

    isDependency (pid) {
        return !!this.dependencies[pid];
    }
}