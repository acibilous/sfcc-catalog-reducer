export default class ProductsContainer {

    /**
     * @param {import('#types').CategoryConfig} confing 
     */
    constructor(config) {
        this.master = [];
        this.masterWithVariationGroups = [];
        this.set = [];
        this.bundle = [];
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
}
