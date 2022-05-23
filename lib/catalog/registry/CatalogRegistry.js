const Types = require('../../types');

const fs = require('fs');

const { log } = require('../../tools/logger');

module.exports = class CatalogRegistry {
    /**
     * @param {string} dataFolder
     */
    constructor (dataFolder) {
        this.dir = dataFolder;

        this.readCache();
    }

    get filePrefix () {
        return this.dir;
    }

    get hasCache () {
        return Object.keys(this.products).length !== 0;
    }

    readCache () {
        /**
         * @type {Record<string, Types.Product>}
         */
        this.products = this.readJSONFile(this.filePrefix + 'products.json');
    }

    /**
     * @param {string} path
     * @returns {object}
     */
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
        this.writeJSONFile(this.filePrefix + 'products.json', this.products);
    }

    /**
     * @param {string} path
     * @param {object} data
     */
    writeJSONFile (path, data) {
        fs.writeFileSync(path, JSON.stringify(data, null, 4));
    }

    /**
     * @param {string} id - product id
     * @returns {Types.Product}
     */
    getOrCreateProduct (id) {
        let instance = this.products[id];

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
