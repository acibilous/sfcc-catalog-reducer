import ProductsConainter from './ProductsConainter.js';

export default class CategoriesProductsContainer {
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
     * @param {string} value
     */
    add(categoryID, productType, value) {
        this.categories[categoryID][productType].push(value);
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
        return Object.keys(this.configs).reduce((accumulator, curr) => [
            ...accumulator,
            ...this.categories[curr].getAllProductIDs()
        ], /** @type {Array<string>} */([]));
    }
}
