import fs from 'fs';
import XMLMatcher from './XMLMatcher.js';
import { log } from '#tools/logger.js';

export default class XMLFilterWriter extends XMLMatcher {
    /**
     * @param {string} inputFilePath - input file of the master catalog
     * @param {string} outputFilePath - minimized path file of the master catalog
     */
    constructor (inputFilePath, outputFilePath) {
        super(inputFilePath);

        this.setName('XMLFilterWriter');

        this.outputFilePath = outputFilePath;
        this.writeStream = fs.createWriteStream(this.outputFilePath);
    }

    /**
     * @param {import('#types').XMLTagFilter} cb - should return true if need to write match into feed
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

        log(`${this.name}Optimization of ${this.formattedFile} has been finished`);
    }

    createWriteFileStream () {
        return fs.createWriteStream(this.outputFilePath);
    }

    get parsingTag () {
        return 'product';
    }

    /**
     * @param {string} tag
     * @param {import('#types').XMLTagFilter} [filter]
     */
    start (tag, filter) {
        if (filter) {
            this.setMatchFilter(filter);
        }

        this.parseByTag(tag || this.parsingTag);

        return this;
    }

    /**
     * @param  {Parameters<this['start']>} args arguments
     * @returns {Promise<void>}
     */
    startAsync(...args) {
        return new Promise((resolve, reject) => {
            this.on('end', () => resolve());

            try {
                this.start(...args);
            } catch (e) {
                reject(e);
            }
        })
    }
};
