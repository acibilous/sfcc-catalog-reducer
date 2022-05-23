const Types = require('../types');

const fs = require('fs');

const XMLMatcher = require('./XMLMatcher');
const { log } = require('../tools/logger');

module.exports = class XMLFilterWriter extends XMLMatcher {
    /**
     * @param {string} inputFilePath - input file of the master catalog
     * @param {string} outputFilePath - minimized path file of the master catalog
     */
    constructor (inputFilePath, outputFilePath) {
        super(inputFilePath);

        this.outputFilePath = outputFilePath;
        this.writeStream = fs.createWriteStream(this.outputFilePath);
    }

    /**
     * @param {Types.MatchFilter} cb - should return true if need to write match into feed
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

    /**
     * @override
     * @param {string} headerPart - before first matched tag in document
     */
    processHeaderPart (headerPart) {
        this.writeStream.write(headerPart);
    }

    /**
     * @override
     * @param {string} footerPart - after last matched tag in document
     */
    processFooterPart (footerPart) {
        this.writeStream.write(footerPart);
        this.writeStream.end();

        log(`Optimization of ${this.filePath} has been finished`);
    }

    createWriteFileStream () {
        return fs.createWriteStream(this.outputFilePath);
    }

    get parsingTag () {
        return 'product';
    }

    /**
     * @param {string} tag
     */
    start (tag) {
        this.parseByTag(tag || this.parsingTag);

        return this;
    }
};
