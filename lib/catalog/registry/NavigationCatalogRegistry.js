const CatalogRegistry = require('./CatalogRegistry'), { log } = require('../../tools/logger');

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
     * @param {String} id - category id
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
        let
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
        for (let cid in this.categories) {
            let category = this.categories[cid];

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
     * @param {Object.<string, product>} masterCatalogProducts 
     */
    updateProducts (masterCatalogProducts) {
        this.removeEmptyCategories();
        
        for (let cid in this.categories) {
            let category = this.categories[cid];

            for (let pid in category.products) {
                if (!masterCatalogProducts[pid]) {
                    delete category.products[pid];
                    continue;
                }

                let
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
     * 
     * @param {Object.<string, categoryOptimizationConfig>} options
     * @param {{ inclusions: string[], includeIfDependency: Boolean, includeChildren: Boolean }} productsConfig that we should skip from optimization
     */
    optimize (options, productsConfig) {
        /**
         * @type {Object.<string, product>}
         */
        this.optimizedProducts = {};
        this.optimizedDependencies = {};

        for (let cid in this.categories) {
            let
                category = this.categories[cid],
                config = options[cid] || options['default'];
            
            for (let pid in category.products) {
                let
                    product = category.products[pid],
                    { dependencies, type } = product;
                
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

        for (let cid in this.categories) {
            let
                category = this.categories[cid],
                config = options[cid] || options['default'];
            
            for (let pid in category.products) {
                let
                    product = category.products[pid],
                    { dependencies, type } = product;
                
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

        for (let cid in this.finalCategoryAssignment) {
            let category = this.finalCategoryAssignment[cid];

            for(let pid in category.products) {
                if (!this.finalProductList[pid] && (!productsConfig || !productsConfig.inclusions.includes(pid))) {
                    delete category.products[pid];
                }
            } 
        }
        

        this.writeJSONFile(this.fileprefix + 'final_product_list.json', this.finalProductList);
        this.writeJSONFile(this.fileprefix + 'final_category_assignment.json', this.finalCategoryAssignment);
    }
}