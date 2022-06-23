const DEPENDENCY_REGEX = /product-id="(.+?)"/g;
const ONLINE_FLAG_REGEX = /<online-flag>([a-z]+)<\/online-flag>/;

/**
 * @param {RegExp} regex
 * @param {string} str
 * @param {Array<RegExpExecArray>} matches
 * @returns {Array<RegExpExecArray>}
 */
function findMatches(regex, str, matches = []) {
    const res = regex.exec(str);

    res && matches.push(res) && findMatches(regex, str, matches);

    return matches;
}

export default class XMLProductDefinition {
    /**
     * @private
     * @type {'true' | 'false'}
     */
    _cachedOnlineFlag;

    /**
     * @private
     * @type {Array<string>}
     */
    _cachedDependencies;

    /**
     * @private
     * @type {string}
     */
    _cachedType;

    /**
     * @param {string} raw 
     * @param {Record<string, string>} productTagAttributes 
     */

    constructor(raw, productTagAttributes) {
        this.raw = raw;
        this.ID = productTagAttributes['product-id'];
        this.productTagAttributes = productTagAttributes;
    }

    /**
     * @private
     * @returns {'true' | 'false'}
     */
    parseOnlineFlag() {
        const match = ONLINE_FLAG_REGEX.exec(this.raw);
    
        return match[1];
    }

    /**
     * @private
     */
    parseDependencies() {
        const dependencies = findMatches(DEPENDENCY_REGEX, this.raw).map(el => el[1]);

        dependencies.shift();

        return dependencies;
    }

    /**
     * @private
     * @param {string} raw
     * @returns {import('#types').ProductType}
     */
    parseProductType() {
        let type = 'standard';

        if (this.raw.includes('bundled-products>')) {
            type = 'bundle';
        } else if (this.raw.includes('product-set-products>')) {
            type = 'set';
        } else if (this.raw.includes('variation-groups>')) {
            type = 'masterWithVariationGroups';
        } else if (this.raw.includes('variations>')) {
            type = 'master';
        }

        return type;
    }

    get dependencies() {
        if (!this._cachedDependencies) {
            this._cachedDependencies = this.parseDependencies();
        }

        return this._cachedDependencies;
    }

    get onlineFlag() {
        if (!this._cachedOnlineFlag) {
            this._cachedOnlineFlag = this.parseOnlineFlag();
        }

        return this._cachedOnlineFlag;
    }

    /**
     * @returns {import('#types').ProductType}
     */
    get type() {
        if (!this._cachedType) {
            this._cachedType = this.parseProductType();
        }

        return this._cachedType;
    }
}
