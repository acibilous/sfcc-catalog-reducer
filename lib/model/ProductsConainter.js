import { inspect } from 'util';

export default class ProductsContainer {
    /**
     * @readonly
     * @type {import('#types').CategoryConfig}
     */
    config;

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

    getNonMasterProducts() {
        return /** @type {Array<string>} */ ([
            ...this.standard,
            ...this.dependencies // TODO filter out variation groups
        ]);
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    getMaxAmountForType(type) {
        const confingForType = this.config[type];
        const configAmount = typeof confingForType === 'number'
            ? confingForType
            : confingForType.length;

        return configAmount;
    }

    isFull() {
        return Object
            .keys(this.config)
            .every(type => this.isFullFor(type));
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    isFullFor(type) {
        const maxAmount = this.getMaxAmountForType(type);

        return this[type].size >= maxAmount;
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    isPredefinedType(type) {
        return this.config[type] instanceof Array;
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
            const currentAmount = this[type].size;
            const maxAmount = this.getMaxAmountForType(type);
            const inspected = inspect(Array.from(this[type]));

            return `${type} {${currentAmount}/${maxAmount}}${currentAmount ? ' ' + inspected : ''}`;
        }).join('\n  ');

        return `ProductsContainer${this.isFull() ? ' [full]' : ''} {\n${inner}\n}`;
    }
}
