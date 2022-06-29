import XMLParser from './XMLParser.js';
import { log } from '#tools/logger.js';

export default class XMLMatcher extends XMLParser {
    constructor(filePath) {
        super(filePath);

        this.setName('XMLParser');
    }

    /** 
     * @param {Array<string>} tagNames
     * @param {import('#types').XMLTagHandler} tagHandler 
     */
    async startAsync () {
        const tagNames = [];
        let tagHandler = null;

        for (let index = 0; index < arguments.length; index++) {
            if (index === arguments.length - 1 && typeof arguments[index] === 'function') {
                tagHandler = arguments[index];
                continue;
            }

            tagNames.push(arguments[index]);
        }

        return new Promise((resolve) => {
            this.on('end', resolve);
            this.on('match', tagHandler);

            this.parseByTags(...tagNames);
        });
    }

    terminate() {
        this.readFileStream.destroy();
        log(`${this.name}Matching of ${this.formattedFile} has been terminated`);
        this.emitter.emit('end');
    }

    /**
     * @param {import('#types').XMLMatcherEventName} event
     * @param {Function} handler
     */
    on (event, handler) {
        return super.on(event, handler);
    }

    /**
     * @override
     */
    onEnd () {
        this.processFooterPart(this.cache);
        log(`${this.name}Matching of ${this.formattedFile} has been finished`);
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
