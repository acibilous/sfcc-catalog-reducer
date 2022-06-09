import ProductsRegistry from './ProductsRegistry.js';
import { log } from '../../tools/logger.js';

/**
 * @typedef Cache
 * @property {Record<string, import('#types').Category>} categories
 * @property {Record<string, import('#types').Category>} finalCategoryAssignment
 * @property {Record<string, import('#types').Product | string>} finalProductList
 */

/**
 * @extends {ProductsRegistry<Cache>}
 */
export default class NavigationAssignmentsRegistry extends ProductsRegistry {
    /**
     * @param {string} dataFolder
     * @param {string} name
     */
     constructor (dataFolder, name) {
        super(dataFolder, ['categories'], name);
    }

    get cachePrefix () {
        return super.cachePrefix + '_assignment_';
    }

    /**
     * @param {string} id - category id
     * @returns {import('#types').Category}
     */
    getOrCreateCategory (id) {
        let instance = this.cache.categories[id];

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

        this.cache.categories[categoryId] = category;
        this.cache.products[productId] = product;
    }

    removeEmptyCategories () {
        for (const cid in this.cache.categories) {
            const category = this.cache.categories[cid];

            if (!Object.keys(category.products).length) {
                log(`Remove empty category ${cid}`);

                delete this.cache.categories[cid];
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

        for (const cid in this.cache.categories) {
            const category = this.cache.categories[cid];

            for (const pid in category.products) {
                if (!masterCatalogProducts[pid]) {
                    delete category.products[pid];
                    continue;
                }

                const masterProduct = masterCatalogProducts[pid];
                const navigationProduct = this.cache.products[pid];
                const mergedProduct = Object.assign({}, masterProduct, navigationProduct);

                category.products[pid] = mergedProduct;

                this.cache.products[pid] = mergedProduct;
            }
        }

        this.writeCache();
    }

    /**
     * @param {Record<string, import('#types').CategoriesConfig>} options
     * @param {import('#types').ProductsConfig} [productsConfig] that we should skip from optimization
     */
    optimize (options, productsConfig) {
        /**
         * @type {Record<string, import('#types').Product>}
         */
        this.optimizedProducts = {};

        /**
         * @type {{[[productId: string]: string]}}
         */
        this.optimizedDependencies = {};

        for (const cid in this.cache.categories) {
            const category = this.cache.categories[cid];
            const config = options[cid] || options.$default;

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

        for (const cid in this.cache.categories) {
            const category = this.cache.categories[cid];
            const config = options[cid] || options.$default;

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

        this.cache.finalProductList = {};

        Object.assign(this.cache.finalProductList, this.optimizedProducts, this.optimizedDependencies);

        this.cache.finalCategoryAssignment = this.cache.categories;

        for (const cid in this.cache.finalCategoryAssignment) {
            const category = this.cache.finalCategoryAssignment[cid];

            for (const pid in category.products) {
                if (!this.cache.finalProductList[pid] && (!productsConfig || !productsConfig.inclusions.includes(pid))) {
                    delete category.products[pid];
                }
            }
        }

        this.writeCache('finalCategoryAssignment', 'finalProductList');
    }

    getFinalUsedCategories() {
        return Object.keys(this.cache.finalCategoryAssignment).filter(categoryKey => {
            const category = this.cache.finalCategoryAssignment[categoryKey];

            return Object.keys(category.products).length !== 0;
        });
    }

    /**
     * @param {Array<Cache['categories']>} categoryCacheArray
     */
    appendCategories(categoryCacheArray) {
        categoryCacheArray.forEach(categories => {
            Object.keys(categories).forEach(categoryID => {
                this.cache.categories[categoryID] = this.cache.categories[categoryID] || {
                    products: {}
                };

                Object.assign(this.cache.categories[categoryID].products, categories[categoryID].products);
            })
        });
    }
};
