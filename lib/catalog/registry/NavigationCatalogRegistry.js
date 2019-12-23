const CatalogRegistry = require('./CatalogRegistry');

/**
 * @typedef {{id: string, type: string, dependencies: Array<string>}} product
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
     * @returns { {categoryId: String, products: {} } }
     */
    getOrCreateCategory (id) {
        let instance = this.categories[id];

        if (!instance) {
            instance = { products: {}, id };
        }

        return instance;
    }

    addCategoryAssignment (categoryId, productId) {
        let
            // categoryInProduct = product.categories[categoryId],
            category = this.getOrCreateCategory(categoryId),
            product = this.getOrCreateProduct(productId),
            productInCategory = category.products[productId];

        if (!productInCategory) {
            category.products[productId] = productId;//product;
        }

        // if (!categoryInProduct) {
        //     product.categories[categoryId] = categoryId;//category;
        // }

        this.categories[categoryId] = category;
        this.products[productId] = product;
    }

    /**
     * Method for updating product types, dependencies by master catalog data
     * After finishing it we have list of all products and their dependencies used in both catalogs
     * 
     * @param {Object.<string, product>} masterCatalogProducts 
     */
    updateProducts (masterCatalogProducts) {
        for (let cid in this.categories) {
            let category = this.categories[cid];

            for (let pid in category.products) {
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
     */
    optimize (options) {
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

        this.writeJSONFile(this.fileprefix + 'final_product_list.json', this.finalProductList);
    }
}