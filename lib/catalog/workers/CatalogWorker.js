const Matcher = require('../../xml/XMLMatcher');
const { log } = require('../../tools/logger');

module.exports = class CatalogWorker extends Matcher {
    constructor (filepath) {
        super(filepath);
        this.setFileStructure(filepath);
    }

    setFileStructure (filepath) {
        const filename = filepath.split('/').slice(-1)[0],
            folder = filepath.replace(filename, '');

        this.path = filepath;
        this.filename = filename;
        this.folder = folder;
    }

    start () {
        if (this.registry && !this.registry.hasCache) {
            this.parseByTag(this.parsingTag);
        } else {
            log(`Parsing results for ${this.filepath} retrieved from cache`);
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
