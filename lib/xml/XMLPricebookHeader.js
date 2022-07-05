const PRICEBOOK_PARENT_REGX = /<parent>(.+?)<\/parent>/;
const ONLY_WHITESPACE_REGX = /^\s*$/;

export default class XMLPricebookHeader {
    /**
     * @private
     * @type {string | null}
     */
    _cachedPatent;

    constructor(rawHeader) {
        this.raw = rawHeader;
    }

    /**
     * @private
     */
    parseParent() {
        const result = PRICEBOOK_PARENT_REGX.exec(this.raw);

        if (!result) {
            return null;
        }

        const parent = result[1];

        if (ONLY_WHITESPACE_REGX.test(parent)) {
            return null;
        }

        return parent;
    }

    get parent() {
        if (this._cachedPatent === undefined) {
            this._cachedPatent = this.parseParent();
        }

        return this._cachedPatent;
    }
}
