const XMLParser = require('./XMLParser');
const { log } = require('../tools/logger');

module.exports = class XMLMatcher extends XMLParser {
    onOpenMatchedTag () {
        if (this.isFirstMatch()) {
            this.onFirstMatch();
        }
    }

    onFirstMatch () {
        const { startTagPosition, position } = this.getParser();
        const startPositionInCache = this.cache.length - (position - startTagPosition) - 2;

        this.tagPart = this.cache.substring(startPositionInCache, this.cache.length);
        this.beforeTag = this.cache.substring(0, startPositionInCache);

        this.processHeaderPart(this.beforeTag);

        //exclude header part from cache
        this.cache = this.cache.substring(startPositionInCache, this.cache.length);
    }

    onCloseMatchedTag () {
        super.onCloseMatchedTag();
        this.onMatchedTag();
        this.resetCache();
    }

    onEnd () {
        this.onMatchesFinished();
        this.processFooterPart(this.cache);
        log(`Matching of ${this.filepath} has been finished`);
        this.emitter.emit('end');
    }

    onMatchesFinished () {}

    onMatchedTag () {
        this.emitter.emit('match', this.streamer._parser.tag, this.cache);
    }

    /**
     * @param {string} headerPart - before first matched tag in document
     */
    processHeaderPart (headerPart) {}

    /**
     * @param {string} footerPart - after last matched tag in document
     */
    processFooterPart (footerPart) {}
};
