const
    Matcher = require('../../xml/XMLMatcher'),
    fs = require('fs'),
    { log } = require('../../tools/logger');

module.exports = class MasterCatalogFilter extends Matcher {
    /**
     * 
     * @param {string} inputFilePath - input file of the master catalog
     * @param {string} outputFilePath - minimized path file of the master catalog
     */
    constructor (inputFilePath, outputFilePath) {
        super(inputFilePath);
        this.outputFilePath = outputFilePath;
        this.writeStream = fs.createWriteStream(this.outputFilePath);
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

    createWriteFileStream () {
        return fs.createWriteStream(this.outputFilePath);
    }

    get parsingTag () {
        return 'product';
    }

    start (tag) {
        this.parseByTag(tag || this.parsingTag);

        return this;
    }
}