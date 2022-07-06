import { inspect } from 'util';

import ProductsContainer from './ProductsContainer.js';
import { filterKeys } from '#tools/object.js'

export default class CategorizedProductsContainer {
    /**
     * @param {import('#types').SpecificCategoryConfigs} categoryConfigs 
     */
    constructor(categoryConfigs) {
        /**
         * @type {{[categoryID: keyof categoryConfigs]: ProductsContainer }}
         */
        this.categories = {};

        /**
         * Gathering all configs except 'keepAsIs'
         * @type {{ [categoryID: string]: import('#types').CategoryConfig }}
         */
        const allObjectConfigs = filterKeys(categoryConfigs, (category) => typeof categoryConfigs[category] !== 'string');

        Object.keys(allObjectConfigs).forEach(categoryID => {
            const config = categoryConfigs[categoryID];
    
            this.categories[categoryID] = new ProductsContainer(config);
        });

        this.configs = allObjectConfigs;
    }

    /**
     * @param {string} categoryID
     * @param {object} product
     * @param {import('#types').ProductType} product.type
     * @param {string} product.ID
     * @param {Array<string>} [product.dependencies]
     * @param {Array<string>} [product.variationGroups]
     */
    add(categoryID, product) {
        this.categories[categoryID].add(product);

        this._cachedIsEveryCategoryFullFlag = undefined;
    
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

    /**
     * @private
     * @type {boolean | undefined}
     */
    _cachedIsEveryCategoryFullFlag;

    isEveryCategoryFull() {
        if (this._cachedIsEveryCategoryFullFlag === undefined) {
            const categories = Object.keys(this.configs);
    
            let flag = true;
        
            for (const categoryID of categories) {
                if (!this.isCategoryFull(categoryID)) {
                    flag = false;
                    break;
                }
            }

            this._cachedIsEveryCategoryFullFlag = flag;
        }

        return this._cachedIsEveryCategoryFullFlag;
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
