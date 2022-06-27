import { inspect } from 'util';

export default class ProductsContainer {

    /**
     * @param {import('#types').CategoryConfig} config 
     */
    constructor(config) {
        /**
         * @type {Set<string>}
         */
        this.master = new Set();

        /**
         * @type {Set<string>}
         */
        this.masterWithVariationGroups = new Set();

        /**
         * @type {Set<string>}
         */
        this.set = new Set();

        /**
         * @type {Set<string>}
         */
        this.bundle = new Set();

        /**
         * @type {Set<string>}
         */
        this.standard = new Set();

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
            return this[key].size >= this.config[key];
        });
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    isFullFor(type) {
        return this[type].size >= this.config[type];
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
        this[type].add(productID);

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
            const inspected = inspect(Array.from(this[type]));

            return `${type} {${this[type].size}/${this.config[type]}}${this[type].size ? ' ' + inspected : ''}`;
        }).join('\n  ');

        return `ProductsContainer${this.isFull() ? ' [full]' : ''} {\n${inner}\n}`;
    }
}
