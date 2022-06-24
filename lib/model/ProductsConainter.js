import { inspect } from 'util';

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

        /**
         * @type {Set<string>}
         */
        this.dependencies = new Set();

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

    /**
     * @returns {Array<string>}
     */
    getAllProductIDs() {
        return [
            ...this.master,
            ...this.masterWithVariationGroups,
            ...this.set,
            ...this.bundle,
            ...this.standard,
            ...this.dependencies
        ];
    }

    /**
     * @param {import('#types').ProductType} type
     * @param {string} productID
     * @param {Array<string>} [dependencies]
     */
    add(type, productID, dependencies) {
        this[type].push(productID);

        if (dependencies) {
            this.addDependencies(dependencies);
        }

        return this;
    }

    /**
     * @param {Array<string>} dependencyList 
     */
    addDependencies(dependencyList) {
        dependencyList.forEach(depenedecy => this.dependencies.add(depenedecy));

        return this;
    }

    [inspect.custom]() {
        const inner = '  ' + Object.keys(this.config).map(type => {
            return `${type} {${this[type].length}/${this.config[type]}}${this[type].length ? ' ' + inspect(this[type]) : ''}`;
        }).join('\n  ');

        return `ProductsContainer${this.isFull() ? ' [full]' : ''} {\n${inner}\n}`;
    }
}
