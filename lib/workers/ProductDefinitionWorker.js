import XMLMatcher from '#xml/XMLMatcher.js';
import XMLProductDefinition from '#xml/XMLProductDefinition.js';
import ProductsConainter from '#model/ProductsConainter.js';
import CategorizedProductsContainer from '#model/CategoriesProductsContainer.js';
import { log, color } from '#tools/logger.js';

export default class ProductDefinitionWorker {
    /**
     * @param {Array<string>} productCatalogs 
     */
    constructor(productCatalogs) {
        this.productCatalogs = productCatalogs;
    }

    /**
     * @param {{[productID: string]: string}} productIDsList 
     * @param {import('#types').SpecificCategoryConfigs} specificConfigs
     * @param {import('#types').GeneralCategoryConfigs['$default']} defaultConfing
     * @param {import('#types').ProductsConfig} productConfig
     */
    async filterProductsByCategories(
        productIDsList,
        specificConfigs,
        defaultConfing,
        { onlineFlagCheck }
    ) {
        /**
         * @type {Set<string>}
         */
        const allProductsDependencies = new Set();

        /**
         * If we haven't parsed master product yet, we can't tell if a product is variation or standalone product.
         * product - category pair
         * @type {{ [productID: string]: string}
         */
        const possiblyStandardProducts = {};

        const savedDefaultProducts = new ProductsConainter(defaultConfing);
        const savedCategorizedProducts = new CategorizedProductsContainer(specificConfigs);

        for (const file of this.productCatalogs) {
            const matcher = new XMLMatcher(file).setName('Product definition parser');

            await matcher.startAsync('product', ({ attributes }, raw) => {
                if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                    matcher.terminate();
                }

                const product = new XMLProductDefinition(raw, attributes);
                
                const onlineCheckResult = onlineFlagCheck
                    ? product.onlineFlag === 'true'
                    : true;
                
                /**
                 * @type {string | undefined}
                 */
                const productCategory = productIDsList[product.ID];

                /**
                 * Is product for some specific category that was parsed previously in navigation catalog
                 */
                const isWhitelistProduct = product.ID in productIDsList;
                
                if (product.type === 'standard') {
                    if (onlineCheckResult && !allProductsDependencies.has(product.ID)
                    ) {
                        possiblyStandardProducts[product.ID] = productCategory;
                    }
                    return;
                }

                const isCurrentContainerFullForCurrentType = savedCategorizedProducts.isFullFor(productCategory, product.type);

                const couldBeSavedAsCategorized = !isCurrentContainerFullForCurrentType && isWhitelistProduct && onlineCheckResult;
                const couldBeSavedAsDefault = !couldBeSavedAsCategorized && !savedDefaultProducts.isFullFor(product.type) && onlineCheckResult;

                product.dependencies.forEach(dependency => {
                    /**
                     * Now we know that this product is variation of some other product.
                     */
                    delete possiblyStandardProducts[dependency];
                    allProductsDependencies.add(dependency);
                });

                if (couldBeSavedAsCategorized) {
                    savedCategorizedProducts.add(productCategory, product.type, product.ID, product.dependencies);
                } else if (couldBeSavedAsDefault) {
                    savedDefaultProducts.add(product.type, product.ID, product.dependencies)
                }
            });

            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }
        }

        /**
         * At this moment we're sure possiblyStandardProducts really contains only standard products
         */
        for (const standardProductID of Object.keys(possiblyStandardProducts)) {
            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }

            if (!standardProductID) {
                continue;
            }

            const categoryID = possiblyStandardProducts[standardProductID];

            const isDefaltFull = savedDefaultProducts.isFullFor('standard');

            const couldCurrentProductBeSavedInDefault = !categoryID || savedCategorizedProducts.isFullFor(categoryID, 'standard');

            if (!isDefaltFull && couldCurrentProductBeSavedInDefault) {
                savedDefaultProducts.add('standard', standardProductID);
            } else if (categoryID) {
                savedCategorizedProducts.add(categoryID, 'standard', standardProductID);
            }

            delete possiblyStandardProducts[standardProductID];
        }

        log(color.cyan('Categorized products:'), savedCategorizedProducts);
        log(color.cyan('Uncategorized products ($default):'), savedDefaultProducts);

        const result = {
            categorized: savedCategorizedProducts.getAllProductIDsFromEveryCategory(),
            default: savedDefaultProducts.getAllProductIDs()
        };

        return result;
    }
}
