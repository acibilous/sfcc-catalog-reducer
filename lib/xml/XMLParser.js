const fs = require('fs'), EventEmitter = require('events'), { log } = require('../tools/logger');

module.exports = class XMLParser {
    constructor (filepath) {
        this.filepath = filepath;
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

    on (event, handler) {
        this.emitter.on(event, handler);

        return this.emitter;
    }

    parseByTag (matchedTagName) {
        log(`Start parsing of ${this.filepath}`);
        this.matchedTagName = matchedTagName;

        this.readFileStream = fs.createReadStream(this.filepath);

        this.readFileStream.pipe(this.streamer);
    }

    getParser () {
        return this.streamer._parser;
    }

    onSymbol (symbol) {
        this.cache += symbol;
    }

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

    onCloseTag (currentTag) {
        if (this.matchedTagName && this.matchedTagName === currentTag) {
            this.isMatchedTagOpen = false;
            this.onCloseMatchedTag();
        }
    }

    onCloseMatchedTag () {
        this.emitter.emit('closematchedtag', this);

        if (this.matchesCount % 10000 === 0) {
            log(`${this.filepath}: Proceeded ${this.matchesCount / 1000}k matches`)
        }
    }

    isFirstMatch () {
        return this.matchesCount === 0;
    }

    onEnd () {
        log(`: Parsing of ${this.filepath} has been finished. ${this.matchesCount} founded.`);
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