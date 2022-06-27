import XMLMatcher from '#xml/XMLMatcher.js';
import XMLProductDefinition from '#xml/XMLProductDefinition.js';
import ProductsConainter from '#model/ProductsConainter.js';
import DependancyMap from '#model/DependancyMap.js';
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
     * @param {object} productDetails 
     * @param {XMLProductDefinition} productDetails.product
     * @param {Set<string>} productDetails.categories
     * @param {boolean} productDetails.onlineCheckResult
     * @param {CategorizedProductsContainer} savedCategorizedProducts 
     * @param {ProductsConainter} savedDefaultProducts 
     * @param {DependancyMap} dependancyMap 
     */
    proccessNonStandardProduct({
        product,
        categories,
        onlineCheckResult
    },
        savedCategorizedProducts,
        savedDefaultProducts,
        dependancyMap
    ) {
        dependancyMap.addByParent(product);

        if (!onlineCheckResult || product.isSkipListProduct) {
            return;
        }

        const availiableCategoryForSavingAsCategorized = savedCategorizedProducts.getUnfilledCategoryForType(categories, product.type);

        if (!availiableCategoryForSavingAsCategorized) {
            if (!savedDefaultProducts.isFullFor(product.type)) {
                savedDefaultProducts.add(product.type, product.ID, product.dependencies);
            }

            return;
        }
    
        savedCategorizedProducts.add(availiableCategoryForSavingAsCategorized, product.type, product.ID, product.dependencies);
    }

    /**
     * @param {{[productID: string]: Set<string>}} productIDsList product - categories pair
     * @param {import('#types').SpecificCategoryConfigs} specificConfigs
     * @param {Set<string>} skipList
     * @param {import('#types').GeneralCategoryConfigs['$default']} defaultConfing
     * @param {import('#types').ProductsConfig} productConfig
     */
    async filterProductsByCategories(
        productIDsList,
        specificConfigs,
        skipList,
        defaultConfing,
        { onlineFlagCheck }
    ) {
        const dependancyMap = new DependancyMap();
        const savedDefaultProducts = new ProductsConainter(defaultConfing);
        const savedCategorizedProducts = new CategorizedProductsContainer(specificConfigs);

        for (const file of this.productCatalogs) {
            const matcher = new XMLMatcher(file).setName('Product definition parser');

            await matcher.startAsync('product', ({ attributes }, raw) => {
                if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                    matcher.terminate();
                }
                
                const product = new XMLProductDefinition(raw, attributes, skipList);
            
                const onlineCheckResult = onlineFlagCheck
                    ? product.onlineFlag === 'true'
                    : true;
            
                const whitelistedCategories = productIDsList[product.ID];

                if (product.type === 'standard') {
                    if (!onlineCheckResult || product.isSkipListProduct) {
                        return;
                    }
                    
                    if (dependancyMap.isDependancy(product.ID)) {
                        const parents =  dependancyMap.getParents(product.ID);

                        if (Array.from(parents).some((parent) => parent.isSkipListProduct)) {
                            return;
                        }

                        if (!savedCategorizedProducts.isEveryCategoryFull()) {
                            parents.forEach(parent => {
                                /**
                                 * This additional parent product processing added for handling cases
                                 * when a variant was assigned in the naigation catalog to a category, but corresponding master was not.
                                 * 
                                 * So if the master product ID is within passed productIDsList, it means it was assigned
                                 * in the navigation catalog, so additional processing is redundant.
                                 */
                                const wasParentProcessed = parent.ID in productIDsList;

                                if (wasParentProcessed) {
                                    return;
                                }

                                const patentCategories = whitelistedCategories;

                                this.proccessNonStandardProduct({
                                    product: parent,
                                    categories: patentCategories,
                                    onlineCheckResult
                                }, savedCategorizedProducts, savedDefaultProducts, dependancyMap);
                            });
                        }

                        return;
                    }

                    dependancyMap.addIndependentProduct(product.ID, whitelistedCategories);
                
                    return;
                }

                this.proccessNonStandardProduct({
                    product,
                    categories: whitelistedCategories,
                    onlineCheckResult
                }, savedCategorizedProducts, savedDefaultProducts, dependancyMap);
            });

            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }
        }

        /**
         * At this moment we're sure dependancyMap.independentProduct really contains only standard (independent) products
         */
        for (const standardProductID of Object.keys(dependancyMap.independentProducts)) {
            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }

            if (!standardProductID) {
                continue;
            }

            const categories = dependancyMap.independentProducts[standardProductID];

            const categoryForSavingAsCategorized = savedCategorizedProducts.getUnfilledCategoryForType(categories, 'standard');

            if (categoryForSavingAsCategorized) {
                savedCategorizedProducts.add(categoryForSavingAsCategorized, 'standard', standardProductID);
            } else if (!savedDefaultProducts.isFullFor('standard')) {
                savedDefaultProducts.add('standard', standardProductID);
            }

            delete dependancyMap.independentProducts[standardProductID];
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
