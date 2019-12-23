const
    Matcher = require('../../xml/XMLMatcher'),
    fs = require('fs'),
    { log } = require('../../tools/logger');

module.exports = class MasterCatalogFilter extends Matcher {
    constructor (filepath) {
        super(filepath);
        this.writeStream = fs.createWriteStream(this.filepath.replace('.xml', `_optimized.xml`))
    }

    initEvents () {}
    /**
     * 
     * @param {Function} cb - should return true if need to write match into feed 
     */
    setMatchFilter (cb) {
        this.filterCallback = cb;
    }

    onMatchedTag () {
        if (this.filterCallback ? this.filterCallback(this.streamer._parser.tag, this.cache) : true) {
            this.writeStream.write(this.cache);
        }
        super.onMatchedTag();
    }

    processHeaderPart (headerPart) {
        this.writeStream.write(headerPart);
    }

    processFooterPart (footerPart) {
        this.writeStream.write(footerPart);
        this.writeStream.end();

        log(`Optimization of ${this.filepath} has been finished`);
    }

    createWriteFileStream (suffix) {
        return fs.createWriteStream(this.filepath.replace('.xml', `_${suffix}.xml`));
    }

    get parsingTag () {
        return 'product';
    }

    start () {
        this.parseByTag(this.parsingTag);

        return this;
    }
}