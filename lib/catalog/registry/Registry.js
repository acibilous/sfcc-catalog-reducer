const Types = require('../../types');

const fs = require('fs');

const { log } = require('../../tools/logger');
const { enabledCache } = require('../../../constants');

console.log(enabledCache);

/**
 * @template {Record<string, object>} Cache
 */
module.exports = class Registry {
    /**
     * @param {string} dataFolder
     * @param {Array<keyof Cache>} cacheFiles
     */
    constructor (dataFolder, cacheFiles) {
        this.dir = dataFolder;

        /**
         * @type {Cache}
         */
        this.cache = {};

        cacheFiles.forEach(key => {
            this.cache[key] = {};
        })

        this.readCache();
    }

    get cachePrefix () {
        return '';
    }

    /**
     *
     * @param {string} key
     * @returns {string}
     */
    getFullCacheFilePath(key) {
        return this.dir + this.cachePrefix + key + '.json';
    }

    get hasCache () {
        const files = Object.keys(this.cache);

        return files.some(
            key => Object.keys(this.cache[key]) > 0
        );
    }

    readCache () {
        if (!enabledCache) {
            return;
        }

        Object.keys(this.cache).forEach((file) => {
            this.cache[file] = this.readJSONFile(this.getFullCacheFilePath(file));
        });
    }

    /**
     * @private
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

    /**
     * @param {Array<keyof Cache>} [certainKeys] - to write only passed keys
     */
    writeCache (...certainKeys) {
        if (!enabledCache) {
            return;
        }

        const keys = certainKeys.length ? certainKeys : Object.keys(this.cache);

        keys.forEach((file) => {
            this.writeJSONFile(
                this.getFullCacheFilePath(file),
                this.cache[file]
            );
        });
    }

    /**
     * @private
     * @param {string} path
     * @param {object} data
     */
    writeJSONFile (path, data) {
        fs.writeFileSync(path, JSON.stringify(data, null, 4));
    }
};
