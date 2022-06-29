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

        /**
         * @type {Set<string>}
         */
        this.dependentVariationGroups = new Set();

        Object.defineProperty(this, 'config', {
            value: config,
            enumerable: false,
        });
    }

    getNonMasterProducts() {
        return /** @type {Array<string>} */ ([
            ...this.standard,
            ...Array.from(this.dependencies).filter(dependency => !this.dependentVariationGroups.has(dependency))
        ]);
    }

    /**
     * @param {keyof import('#types').CategoryConfig} type 
     */
    getMaxAmountForType(type) {
        const configForType = this.config[type];
        const configAmount = typeof configForType === 'number'
            ? configForType
            : configForType.length;

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
     * @param {object} product
     * @param {import('#types').ProductType} product.type
     * @param {string} product.ID
     * @param {Array<string>} [product.dependencies]
     * @param {Array<string>} [product.variationGroups]
     */
    add({ ID, type, dependencies, variationGroups }) {
        this[type].add(ID);
        
        this.addDependencies(dependencies, variationGroups);

        return this;
    }

    /**
     * @param {Array<string>} [dependencyList] 
     * @param {Array<string>} [variationGroups]
     */
    addDependencies(dependencyList, variationGroups) {
        if (dependencyList) {
            dependencyList.forEach(dependency => this.dependencies.add(dependency));
        }

        if (variationGroups) {
            variationGroups.forEach(dependency => this.dependentVariationGroups.add(dependency));
        }

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
