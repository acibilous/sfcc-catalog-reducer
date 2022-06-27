import ProductsConainter from './ProductsConainter.js';
import { inspect } from 'util';

export default class CategorizedProductsContainer {
    /**
     * @param {import('#types').SpecificCategoryConfigs} categoryConfigs 
     */
    constructor(categoryConfigs) {
        /**
         * @type {{[categoryID: keyof categoryConfigs]: ProductsConainter }}
         */
        this.categories = {};

        Object.keys(categoryConfigs).forEach(categoryID => {
            this.categories[categoryID] = new ProductsConainter(categoryConfigs[categoryID])
        });

        this.configs = categoryConfigs;
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

    getAllProductIDsFromEveryCategory() {
        return Object.keys(this.configs).reduce((accumulator, categoryID) => [
            ...accumulator,
            ...this.categories[categoryID].getAllProductIDs()
        ], /** @type {Array<string>} */([]));
    }

    /**
     * 
     * @param {Set<string> | undefined} categories 
     * @param {import('#types').ProductType} productType 
     * @returns {string | undefined}
     */
    getUnfilledCategoryForType(categories, productType) {
        if (!categories) {
            return;
        }

        for (const category of categories) {
            if (this.categories[category] && !this.categories[category].isFullFor(productType)) {
                return category;
            }
        }
    }

    [inspect.custom]() {
        const isEmpty = Object.keys(this.categories).length === 0;

        return `CategorizedProductsContainer ${isEmpty ? '[empty]' : inspect(this.categories)} `;
    }
}
