import Types from '../../types.js';
import XMLMatcher from '../../xml/XMLMatcher.js';
import { log } from '../../tools/logger.js';

/**
 * @template {Types.ProductsRegistry} RegistryConstructor
 */
export default class CatalogWorker extends XMLMatcher {
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

    startAsync() {
        return new Promise((resolve, reject) => {
            this.on('end', () => resolve());

            try {
                this.start();
            } catch (e) {
                reject(e);
            }
        })
    }

    get parsingTag () {
        return 'catalog';
    }

    destroy () {
        delete this.registry;
    }
};
