const CatalogRegistry = require('./CatalogRegistry');
const { log } = require('../../tools/logger');

/**
 * @typedef {{type: string, dependencies: Array<string>}} product
 */

module.exports = class NavigationCatalogRegistry extends CatalogRegistry {
    get fileprefix () {
        return super.fileprefix + 'navigation_';
    }

    get hasCache () {
        return Object.keys(this.products).length && Object.keys(this.categories).length;
    }

    readCache () {
        super.readCache();
        /**
         * @type Object.<string, category>
         */
        this.categories = {};
        this.categories = this.readJSONFile(this.fileprefix + 'categories.json');
    }

    writeCache () {
        super.writeCache();
        this.writeJSONFile(this.fileprefix + 'categories.json', this.categories);
    }

    /**
     *
     * @param {string} id - category id
     * @returns { {categoryId: String, products: Object.<string, product>} }
     */
    getOrCreateCategory (id) {
        let instance = this.categories[id];

        if (!instance) {
            instance = { products: {} };
        }

        return instance;
    }

    addCategoryAssignment (categoryId, productId) {
        const
            category = this.getOrCreateCategory(categoryId),
            product = this.getOrCreateProduct(productId),
            productInCategory = category.products[productId];

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
     * @param {object.<string, product>} masterCatalogProducts
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

                const
                    masterProduct = masterCatalogProducts[pid],
                    navigationProduct = this.products[pid],
                    mergedProduct = Object.assign({}, masterProduct, navigationProduct);

                category.products[pid] = mergedProduct;

                this.products[pid] = mergedProduct;
            }
        }

        this.writeCache();
    }

    /**
     * @typedef {{set: number, bundle: number, master: number}} categoryOptimizationConfig
     */

    /**
     * @param {object.<string, categoryOptimizationConfig>} options
     * @param {{inclusions: string[], includeIfDependency: boolean, includeChildren: boolean}} productsConfig that we should skip from optimization
     */
    optimize (options, productsConfig) {
        /**
         * @type {object.<string, product>}
         */
        this.optimizedProducts = {};
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

                    product.dependencies.forEach(depId => this.optimizedDependencies[depId] = depId);
                }

                if (productsConfig) {
                    if (productsConfig.inclusions.includes(pid)) {
                        this.optimizedProducts[pid] = product;

                        if (productsConfig.includeChildren) {
                            product.dependencies.forEach(depId => this.optimizedDependencies[depId] = depId);
                        }
                    }

                    if (productsConfig.includeIfDependency) {
                        if (product.dependencies.some(depId => productsConfig.inclusions.includes(depId))) {
                            this.optimizedProducts[pid] = product;
                            product.dependencies.forEach(depId => this.optimizedDependencies[depId] = depId);
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

        this.writeJSONFile(this.fileprefix + 'final_product_list.json', this.finalProductList);
        this.writeJSONFile(this.fileprefix + 'final_category_assignment.json', this.finalCategoryAssignment);
    }
};
