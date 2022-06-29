import { inspect } from 'util';

import ProductsConainter from './ProductsConainter.js';
import { filterKeys } from '#tools/object.js'

export default class CategorizedProductsContainer {
    /**
     * @param {import('#types').SpecificCategoryConfigs} categoryConfigs 
     */
    constructor(categoryConfigs) {
        /**
         * @type {{[categoryID: keyof categoryConfigs]: ProductsConainter }}
         */
        this.categories = {};

        const allObjectConfings = filterKeys(categoryConfigs, (key) => typeof categoryConfigs[key] !== 'string');

        Object.keys(allObjectConfings).forEach(categoryID => {
            const config = categoryConfigs[categoryID];
    
            this.categories[categoryID] = new ProductsConainter(config);
        });

        this.configs = allObjectConfings;
    }

    /**
     * @param {string} categoryID
     * @param {import('#types').ProductType} productType
     * @param {string} productID
     * @param {Array<string>} [dependencies]
     */
    add(categoryID, productType, productID, dependencies) {
        this.categories[categoryID].add(productType, productID);

        if (dependencies) {
            this.categories[categoryID].addDependencies(dependencies);
        }

        return this;
    }

    /**
     * @param {string} categoryID 
     * @param {import('#types').ProductType} productType 
     */
    isFullFor(categoryID, productType) {
        if (!this.categories[categoryID]) {
            return;
        }

        return this.categories[categoryID].isFullFor(productType);
    }

    isCategoryFull(categoryID) {
        return this.categories[categoryID].isFull();
    }

    isEveryCategoryFull() {
        const categories = Object.keys(this.configs);

        for (const categoryID of categories) {
            if (!this.isCategoryFull(categoryID)) {
                return false;
            }
        }

        return true;
    }

    getAllProductIDs() {
        return Object.keys(this.configs).reduce((accumulator, categoryID) => [
            ...accumulator,
            ...this.categories[categoryID].getAllProductIDs()
        ], /** @type {Array<string>} */([]));
    }

    getNonMasterProducts() {
        return Object.keys(this.configs).reduce((accumulator, categoryID) => [
            ...accumulator,
            ...this.categories[categoryID].getNonMasterProducts()
        ], /** @type {Array<string>} */([]));
    }

    /**
     * 
     * @param {Set<string> | undefined} categories 
     * @param {import('#types').ProductType} productType 
     * @returns {string | undefined}
     */
    getAvailableUnfilledCategoryForType(categories, productType) {
        if (!categories) {
            return;
        }

        for (const category of categories) {
            if (this.categories[category] 
                && !this.categories[category].isPredefinedType(productType)
                && !this.categories[category].isFullFor(productType)) {
                return category;
            }
        }
    }

    [inspect.custom]() {
        const isEmpty = Object.keys(this.categories).length === 0;

        return `CategorizedProductsContainer ${isEmpty ? '[empty]' : inspect(this.categories)} `;
    }
}
