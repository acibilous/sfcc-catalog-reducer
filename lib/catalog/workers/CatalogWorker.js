const Types = require('../../types');

const XMLMatcher = require('../../xml/XMLMatcher');
const { log } = require('../../tools/logger');

/**
 * @template {Types.ProductsRegistry} RegistryConstructor
 */
module.exports = class CatalogWorker extends XMLMatcher {
    /**
     * @param {string} filePath
     * @param {RegistryConstructor} ProductsRegistryCtr
     */
    constructor (filePath, ProductsRegistryCtr) {
        super(filePath);

        this.setFileStructure(filePath);

        /**
         * @type {RegistryConstructor}
         */
        this.registry = new ProductsRegistryCtr(this.folder);

        this.initEvents();
    }

    initEvents () {
        this.on('end', () => this.registry.writeCache());
    }

    /**
     * @param {string} filePath
     */
    setFileStructure (filePath) {
        const [filename] = filePath.split('/').slice(-1);

        const folder = filePath.replace(filename, '');

        this.path = filePath;
        this.filename = filename;
        this.folder = folder;
    }

    start () {
        if (this.registry && !this.registry.hasCache) {
            this.parseByTag(this.parsingTag);
        } else {
            log(`Parsing results for ${this.filePath} retrieved from cache`);
            this.emitter.emit('end');
        }

        return this;
    }

    get parsingTag () {
        return 'catalog';
    }

    destroy () {
        delete this.registry;
    }
};
