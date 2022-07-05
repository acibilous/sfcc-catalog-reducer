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
     * @param {import('#types').XMLTagFilter} callback - should return true if need to write match into feed
     */
    setMatchFilter (callback) {
        this.filterCallback = callback;
    }

    onMatchedTag () {
        if (this.filterCallback ? this.filterCallback(this.streamer._parser.tag, this.cache) : true) {
            this.writeStream.write(this.cache);
        }

        super.onMatchedTag();
    }

    /**
     * @param {import('#types').XMLFilterWriterEventName} event
     * @param {Function} handler
     */
    on(event, handler) {
        return super.on(event, handler);
    }

    onEnd() {
        this.emitter.emit('afterLastMatch', this.writeStream);

        super.onEnd();
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
     * @param {Array<string>} [tags]
     * @param {import('#types').XMLTagFilter} [filter]
     */
    start() {
        const tags = [];
        let filter = null;

        for (let index = 0; index < arguments.length; index++) {
            if (index === arguments.length - 1 && typeof arguments[index] === 'function') {
                filter = arguments[index];
                continue;
            }

            tags.push(arguments[index]);
        }

        if (filter) {
            this.setMatchFilter(filter);
        }

        this.parseByTags(...tags || this.parsingTag);

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
}
