import XMLParser from './XMLParser.js';
import { log } from '../tools/logger.js';

export default class XMLMatcher extends XMLParser {
    /**
     * @param {import('#types').XMLMatcherEventName} event
     * @param {Function} handler
     */
    on (event, handler) {
        super.on(event, handler);
    }

    /**
     * @override
     */
    onEnd () {
        this.processFooterPart(this.cache);
        log(`Matching of ${this.filePath} has been finished`);
        this.emitter.emit('end');
    }

    onOpenMatchedTag () {
        super.onOpenMatchedTag();

        if (this.isFirstMatch()) {
            this.onFirstMatch();
        }
    }

    onCloseMatchedTag () {
        super.onCloseMatchedTag();

        this.onMatchedTag();
        this.resetCache();
    }

    onMatchedTag () {
        this.emitter.emit('match', this.streamer._parser.tag, this.cache);
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

    /**
     * @abstract
     * @param {string} headerPart - before first matched tag in document
     */
    processHeaderPart (headerPart) {}

    /**
     * @abstract
     * @param {string} footerPart - after last matched tag in document
     */
    processFooterPart (footerPart) {}
};
