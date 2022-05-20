const Types = require('../types');

const fs = require('fs');
const EventEmitter = require('events');
const { log } = require('../tools/logger');

module.exports = class XMLParser {
    /**
     * @param {string} filePath
     */
    constructor (filePath) {
        this.filePath = filePath;
        this.streamer = require('./sax').createStream(true);
        this.streamer.on('symbol', this.onSymbol.bind(this));
        this.streamer.on('opentag', this.onOpenTag.bind(this));
        this.streamer.on('closetag', this.onCloseTag.bind(this));
        this.streamer.on('end', this.onEnd.bind(this));
        this.streamer.on('error', this.onError.bind(this));

        this.matchesCount = 0;
        this.cache = '';
        this.emitter = new EventEmitter();
    }

    /**
     * @param {Types.XMLParserEventName} event
     * @param {Function} handler
     * @returns Event emmiter
     */
    on (event, handler) {
        this.emitter.on(event, handler);

        return this.emitter;
    }

    /**
     * @param {string} matchedTagName
     */
    parseByTag (matchedTagName) {
        log(`Start parsing of ${this.filePath}`);
        this.matchedTagName = matchedTagName;

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
     * @param {string} currentTag
     */
    onOpenTag (currentTag) {
        if (this.matchedTagName && this.matchedTagName === currentTag.name) {
            this.isMatchedTagOpen = true;
            this.onOpenMatchedTag();
            this.matchesCount++;
        }
    }

    onOpenMatchedTag () {
        this.emitter.emit('openmatchedtag', this);
    }

    /**
     * @param {string} symbol
     * @param currentTag
     */
    onCloseTag (currentTag) {
        if (this.matchedTagName && this.matchedTagName === currentTag) {
            this.isMatchedTagOpen = false;
            this.onCloseMatchedTag();
        }
    }

    onCloseMatchedTag () {
        this.emitter.emit('closematchedtag', this);

        if (this.matchesCount % 10000 === 0) {
            log(`${this.filePath}: Proceeded ${this.matchesCount / 1000}k matches`);
        }
    }

    isFirstMatch () {
        return this.matchesCount === 0;
    }

    onEnd () {
        log(`: Parsing of ${this.filePath} has been finished. ${this.matchesCount} founded.`);
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
};
