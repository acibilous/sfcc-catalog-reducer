const Types = require('../../types');

const CatalogRegistry = require('./CatalogRegistry');
const { log } = require('../../tools/logger');

/**
 * @typedef {{type: string, dependencies: Array<string>}} product
 */

module.exports = class NavigationAssignmentsRegistry extends CatalogRegistry {
    /**
     * @type {Record<string, Types.Product>}
     */
    finalProductList;

    get filePrefix () {
        return super.filePrefix + 'navigation_';
    }

    get hasCache () {
        return Object.keys(this.products).length && Object.keys(this.categories).length;
    }

    readCache () {
        super.readCache();

        /**
         * @type {Record<string, Types.Category>}
         */
        this.categories = this.readJSONFile(this.filePrefix + 'categories.json');
    }

    writeCache () {
        super.writeCache();
        this.writeJSONFile(this.filePrefix + 'categories.json', this.categories);
    }

    /**
     *
     * @param {string} id - category id
     * @returns {Types.Category}
     */
    getOrCreateCategory (id) {
        let instance = this.categories[id];

        if (!instance) {
            instance = { products: {} };
        }

        return instance;
    }

    /**
     * @param {string} categoryId
     * @param {string} productId
     */
    addCategoryAssignment (categoryId, productId) {
        const category = this.getOrCreateCategory(categoryId);
        const product = this.getOrCreateProduct(productId);
        const productInCategory = category.products[productId];

        if (!productInCategory) {
            category.products[productId] = productId;
        }

        this.categories[categoryId] = category;
        this.products[productId] = product;
    }

    removeEmptyCategories () {
        for (const cid in this.categories) {
            const category = this.categories[cid];

            if (!Object.keys(category.products).length) {
                log(`Remove empty category ${cid}`);

                delete this.categories[cid];
            }
        }
    }

    /**
     * Method for updating product types, dependencies by master catalog data
     * After finishing it we have list of all products and their dependencies used in both catalogs
     *
     * @param {Record<string, product>} masterCatalogProducts
     */
    updateProducts (masterCatalogProducts) {
        this.removeEmptyCategories();

        for (const cid in this.categories) {
            const category = this.categories[cid];

            for (const pid in category.products) {
                if (!masterCatalogProducts[pid]) {
                    delete category.products[pid];
                    continue;
                }

                const masterProduct = masterCatalogProducts[pid];
                const navigationProduct = this.products[pid];
                const mergedProduct = Object.assign({}, masterProduct, navigationProduct);

                category.products[pid] = mergedProduct;

                this.products[pid] = mergedProduct;
            }
        }

        this.writeCache();
    }

    /**
     * @param {Record<string, CategoryOptimizationConfig>} options
     * @param {Types.ProductsConfig} productsConfig that we should skip from optimization
     */
    optimize (options, productsConfig) {
        /**
         * @type {Record<string, Types.Product>}
         */
        this.optimizedProducts = {};

        /**
         * @type {Record<string, string>}
         */
        this.optimizedDependencies = {};

        for (const cid in this.categories) {
            const category = this.categories[cid];
            const config = options[cid] || options.default;

            for (const pid in category.products) {
                const product = category.products[pid];
                const { type } = product;

                if (this.optimizedProducts[pid]) {
                    continue;
                }

                if (config[type] && type !== 'standard') {
                    this.optimizedProducts[pid] = product;
                    config[type]--;

                    product.dependencies.forEach(depId => { this.optimizedDependencies[depId] = depId; });
                }

                if (productsConfig) {
                    if (productsConfig.inclusions.includes(pid)) {
                        this.optimizedProducts[pid] = product;

                        if (productsConfig.includeChildren) {
                            product.dependencies.forEach(depId => { this.optimizedDependencies[depId] = depId; });
                        }
                    }

                    if (productsConfig.includeIfDependency) {
                        if (product.dependencies.some(depId => productsConfig.inclusions.includes(depId))) {
                            this.optimizedProducts[pid] = product;
                            product.dependencies.forEach(depId => { this.optimizedDependencies[depId] = depId; });
                        }
                    }
                }
            }
        }

        for (const cid in this.categories) {
            const category = this.categories[cid];
            const config = options[cid] || options.default;

            for (const pid in category.products) {
                const product = category.products[pid];
                const { type } = product;

                if (this.optimizedProducts[pid]) {
                    continue;
                }

                if (config[type] && type === 'standard') {
                    this.optimizedProducts[pid] = product;
                    config[type]--;

                    if (this.optimizedDependencies[pid]) {
                        delete this.optimizedDependencies[pid];
                    }
                }
            }
        }

        Object.assign(this.finalProductList = {}, this.optimizedProducts, this.optimizedDependencies);

        this.finalCategoryAssignment = this.categories;

        for (const cid in this.finalCategoryAssignment) {
            const category = this.finalCategoryAssignment[cid];

            for (const pid in category.products) {
                if (!this.finalProductList[pid] && (!productsConfig || !productsConfig.inclusions.includes(pid))) {
                    delete category.products[pid];
                }
            }
        }

        this.writeJSONFile(this.filePrefix + 'final_product_list.json', this.finalProductList);
        this.writeJSONFile(this.filePrefix + 'final_category_assignment.json', this.finalCategoryAssignment);
    }
};
