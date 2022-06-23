export default class ProductsContainer {

    /**
     * @param {import('#types').CategoryConfig} confing 
     */
    constructor(config) {
        /**
         * @type {Array<string>}
         */
        this.master = [];

        /**
         * @type {Array<string>}
         */
        this.masterWithVariationGroups = [];

        /**
         * @type {Array<string>}
         */
        this.set = [];

        /**
         * @type {Array<string>}
         */
        this.bundle = [];

        /**
         * @type {Array<string>}
         */
        this.standard = [];

        Object.defineProperty(this, 'config', {
            value: config,
            enumerable: false,
        });
    }

    isFull() {
        return Object.keys(this.config).every(key => {
            return this[key].length >= this.config[key];
        });
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    isFullFor(type) {
        return this[type].length >= this.config[type];
    }

    getAllProductIDs() {
        return [
            ...this.master,
            ...this.masterWithVariationGroups,
            ...this.set,
            ...this.bundle,
            ...this.standard
        ];
    }
}