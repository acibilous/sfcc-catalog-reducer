import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import sax from './sax.js';
import { log, color } from '#tools/logger.js';

export default class XMLParser {
    /**
     * @param {string} filePath
     */
    constructor (filePath) {
        this.setName('XMLParser');
        this.filePath = filePath;
        this.formattedFile = color.gray(path.relative(process.cwd(), filePath));
        this.streamer = sax.createStream(true);
        this.streamer.on('symbol', this.onSymbol.bind(this));
        this.streamer.on('opentag', this.onOpenTag.bind(this));
        this.streamer.on('closetag', this.onCloseTag.bind(this));
        this.streamer.on('end', this.onEnd.bind(this));
        this.streamer.on('error', this.onError.bind(this));

        /**
         * @type {{ [tagName: string]: number }}
         */
        this.matchesCount = {};
        this.cache = '';
        this.emitter = new EventEmitter();
    }

    get totalMatchesCount() {
        return Object.values(this.matchesCount).reduce((a, b) => a + b, 0);
    }

    /**
     * @param {string} name 
     */
    setName(name) {
        this.name = color.green(name + ': ');

        return this;
    }

    /**
     * @param {import('#types').XMLParserEventName} event
     * @param {Function} handler
     * @returns Event emmiter
     */
    on (event, handler) {
        this.emitter.on(event, handler);

        return this;
    }

    /**
     * @param {Array<string>} matchedTags
     */
    parseByTags (...matchedTags) {
        log(`${this.name}Start parsing of ${this.formattedFile}`);
    
        this.matchedTags = matchedTags;

        this.matchedTags.forEach(tagName => {
            this.matchesCount[tagName] = 0;
        });

        this.readFileStream = fs.createReadStream(this.filePath);

        this.readFileStream.pipe(this.streamer);
    }

    getParser () {
        return this.streamer._parser;
    }

    /**
     * @param {string} symbol
     */
    onSymbol (symbol) {
        this.cache += symbol;
    }

    /**
     * @param {{ name: string }} currentTag
     */
    onOpenTag (currentTag) {
        if (this.matchedTags && this.matchedTags.includes(currentTag.name)) {
            this.isMatchedTagOpen = true;
            this.onOpenMatchedTag(currentTag.name);
            this.matchesCount[currentTag.name]++;
        }
    }

    /**
     * @param {string} _tagName 
     */
    onOpenMatchedTag (_tagName) {
        this.emitter.emit('openmatchedtag', this);
    }

    /**
     * @param {string} currentTag
     */
    onCloseTag (currentTag) {
        if (this.matchedTags && this.matchedTags.includes(currentTag)) {
            this.isMatchedTagOpen = false;
            this.onCloseMatchedTag();
        }
    }

    onCloseMatchedTag () {
        this.emitter.emit('closematchedtag', this);

        if (this.totalMatchesCount % 10000 === 0) {
            log(`${this.name}${this.formattedFile} - Proceeded ${this.totalMatchesCount / 1000}k matches`);
        }
    }

    /**
     * @param {string} tagName 
     */
    isFirstMatch (tagName) {
        return this.matchesCount[tagName] === 0;
    }

    onEnd () {
        log(`${this.name}Parsing of ${this.formattedFile} has been finished. ${this.matchesCount} founded.`);
    }

    onError (err) {
        throw err;
    }

    resetCache () {
        this.cache = '';
    }

    getCache () {
        return this.cache;
    }
}
