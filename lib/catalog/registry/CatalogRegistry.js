const fs = require('fs'), { log } = require('../../tools/logger');

/**
 * @typedef {{id: string, type: string, dependencies: Array<string>}} product
 */

/**
 * @typedef {{id: string, products: Object.<string, product>} category
 */
module.exports = class CatalogRegistry {
    constructor (dataFolder) {
        this.dir = dataFolder;
        this.readCache();
    }

    get fileprefix () {
        return this.dir;
    }

    get hasCache () {
        return Object.keys(this.products).length;
    }

    readCache () {
        /**
         * @type {Object.<string, product>}
         */
        this.products = {};

        this.products = this.readJSONFile(this.fileprefix + 'products.json');
    }

    readJSONFile (path) {
        let data = '{}';

        try {
            data = fs.readFileSync(path, 'utf8');
        } catch (err) {
            log('No cached registry in ' + path);
        }

        return JSON.parse(data);
    }

    writeCache () {
        this.writeJSONFile(this.fileprefix + 'products.json', this.products);
    }

    writeJSONFile (path, data) {
        return fs.writeFileSync(path, JSON.stringify(data, null, 4));
    }

    /**
     * @param {String} id - product id
     * @returns { { id: String} }
     */
    getOrCreateProduct (id) {
        let instance = this.products[id];

        if (!instance) {
            instance = { id };
        }

        return instance;
    }

    hasProduct (id) {
        return !!this.products[id];
    }
}