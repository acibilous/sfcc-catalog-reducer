import XMLMatcher from '#xml/XMLMatcher.js';
import XMLProductDefinition from '#xml/XMLProductDefinition.js';
import ProductsContainer from '#model/ProductsContainer.js';
import DependencyMap from '#model/DependencyMap.js';
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
     * @private
     * @param {object} productDetails 
     * @param {XMLProductDefinition | import('#model/DependencyMap').DependencyParent} productDetails.product
     * @param {Set<string>} productDetails.categories
     * @param {boolean} productDetails.onlineCheckResult
     * @param {CategorizedProductsContainer} savedCategorizedProducts 
     * @param {ProductsContainer} savedDefaultProducts 
     * @param {{ [productID: string]: Array<string>}} predefinedCategorizedProducts
     * @param {Array<string>} predefinedDefaultProducts
     * @param {DependencyMap} dependencyMap 
     */
    processNonStandardProduct({
        product,
        categories,
        onlineCheckResult
    },
        savedCategorizedProducts,
        savedDefaultProducts,
        predefinedCategorizedProducts,
        predefinedDefaultProducts,
        dependencyMap
    ) {
        dependencyMap.addByParent(product);

        if (!onlineCheckResult || product.isSkipListProduct) {
            return;
        }

        const predefinedCategories = predefinedCategorizedProducts[product.ID];

        if (predefinedCategories && predefinedCategories.length > 0) {
            predefinedCategories.forEach(category => savedCategorizedProducts.add(
                category,
                product
            ));

            return;
        }

        if (predefinedDefaultProducts.includes(product.ID)) {
            savedDefaultProducts.add(product);
            return;
        }

        const availableCategoryForSavingAsCategorized = savedCategorizedProducts.getAvailableUnfilledCategoryForType(
            categories,
            product.type
        );

        if (!availableCategoryForSavingAsCategorized) {
            const isPredefinedType = savedDefaultProducts.isPredefinedType(product.type);

            if (!isPredefinedType && !savedDefaultProducts.isFullFor(product.type)) {
                savedDefaultProducts.add(product);
            }

            return;
        }

        savedCategorizedProducts.add(availableCategoryForSavingAsCategorized, product);
    }

    /**
     * @param {{[productID: string]: Set<string>}} productIDsList product - categories pair
     * @param {import('#types').SpecificCategoryConfigs} specificConfigs
     * @param {Set<string>} skipList
     * @param {import('#types').GeneralCategoryConfigs['$default']} defaultConfig
     * @param {import('#types').ProductsConfig} productConfig
     */
    async filterProductsByCategories(
        productIDsList,
        specificConfigs,
        skipList,
        defaultConfig,
        { onlineFlagCheck }
    ) {
        const predefinedCategorizedProducts = this.getPredefinedProductsByCategories(specificConfigs);
        const predefinedDefaultProducts = this.getPredefinedProducts(defaultConfig);

        const dependencyMap = new DependencyMap();
        const savedDefaultProducts = new ProductsContainer(defaultConfig);
        const savedCategorizedProducts = new CategorizedProductsContainer(specificConfigs);

        this.setPredefinedStandardProducts(savedDefaultProducts, defaultConfig);
        this.setPredefinedStandardProductsByCategory(savedCategorizedProducts, specificConfigs);

        for (const file of this.productCatalogs) {
            const matcher = new XMLMatcher(file).setName('Product definition parser');

            await matcher.startAsync('product', ({ attributes }, raw) => {
                if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                    matcher.terminate();
                }

                const product = new XMLProductDefinition(raw, attributes, skipList);

                const onlineCheckResult = onlineFlagCheck
                    ? product.onlineFlag
                    : true;

                const whitelistedProductCategories = productIDsList[product.ID];

                if (product.type === 'standard') {
                    if (!onlineCheckResult || product.isSkipListProduct) {
                        return;
                    }

                    if (dependencyMap.isDependency(product.ID)) {
                        const parents = dependencyMap.getParents(product.ID);

                        if (Array.from(parents).some((parent) => parent.isSkipListProduct)) {
                            return;
                        }

                        if (!savedCategorizedProducts.isEveryCategoryFull()) {
                            parents.forEach(parent => {
                                /**
                                 * This additional parent product processing added for handling cases
                                 * when a variant was assigned in the navigation catalog to a category, but corresponding master was not.
                                 * 
                                 * So if the master product ID is within passed productIDsList, it means it was assigned
                                 * in the navigation catalog, so additional processing is redundant.
                                 */
                                const wasParentProcessed = parent.ID in productIDsList;

                                if (wasParentProcessed) {
                                    return;
                                }

                                const parentCategories = whitelistedProductCategories;

                                this.processNonStandardProduct({
                                        product: parent,
                                        categories: parentCategories,
                                        onlineCheckResult
                                    },
                                    savedCategorizedProducts,
                                    savedDefaultProducts,
                                    predefinedCategorizedProducts,
                                    predefinedDefaultProducts,
                                    dependencyMap
                                );
                            });
                        }

                        return;
                    }

                    if (predefinedDefaultProducts.includes(product.ID)) {
                        return;
                    }

                    dependencyMap.addIndependentProduct(
                        product.ID,
                        whitelistedProductCategories
                    );

                    return;
                }

                this.processNonStandardProduct({
                        product,
                        categories: whitelistedProductCategories,
                        onlineCheckResult
                    },
                    savedCategorizedProducts,
                    savedDefaultProducts,
                    predefinedCategorizedProducts,
                    predefinedDefaultProducts,
                    dependencyMap
                );
            });

            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }
        }

        /**
         * At this moment we're sure dependencyMap.independentProduct really contains only standard (independent) products
         */
        for (const standardProductID of Object.keys(dependencyMap.independentProducts)) {
            if (savedCategorizedProducts.isEveryCategoryFull() && savedDefaultProducts.isFull()) {
                break;
            }

            if (!standardProductID) {
                continue;
            }

            const categories = dependencyMap.independentProducts[standardProductID];

            const categoryForSavingAsCategorized = savedCategorizedProducts.getAvailableUnfilledCategoryForType(categories, 'standard');

            if (categoryForSavingAsCategorized) {
                savedCategorizedProducts.add(
                    categoryForSavingAsCategorized,
                    { ID: standardProductID, type: 'standard' }
                );
            } else if (!savedDefaultProducts.isFullFor('standard')) {
                savedDefaultProducts.add({ ID: standardProductID, type: 'standard' });
            }

            delete dependencyMap.independentProducts[standardProductID];
        }

        log(color.cyan('Categorized products:'), savedCategorizedProducts);
        log(color.cyan('Uncategorized products ($default):'), savedDefaultProducts);

        const result = {
            default: savedDefaultProducts.getAllProductIDs(),
            categorized: savedCategorizedProducts.getAllProductIDs(),
            nonMasters: [
                ...savedDefaultProducts.getNonMasterProducts(),
                ...savedCategorizedProducts.getNonMasterProducts()
            ]
        };

        return result;
    }

    /**
     * @param {CategorizedProductsContainer} container 
     * @param {import('#types').SpecificCategoryConfigs} configs 
     */
    setPredefinedStandardProductsByCategory(container, configs) {
        Object.keys(configs).forEach(category => 
            this.setPredefinedStandardProducts(container.categories[category], configs[category]) 
        );
    }

    /**
     * @param {ProductsContainer} container 
     * @param {import('#types').CategoryConfig | string} config 
     */
     setPredefinedStandardProducts(container, config) {
        if (typeof config === 'string' || typeof config.standard === 'number') return;

        config.standard.forEach(ID => container.add({ ID, type: 'standard' }));
    }

    /**
     * @param {import('#types').CategoryConfig} categoryConfig 
     * @returns {Array<string>}
     */
    getPredefinedProducts(categoryConfig) {
        return Object
            .values(categoryConfig)
            .reduce((accumulator, option) => {
                if (option instanceof Array) {
                    accumulator = [
                        ...accumulator,
                        ...option
                    ];
                }

                return accumulator;
            }, []);
    }

    /**
     * @param {import('#types').SpecificCategoryConfigs} specificConfigs 
     * @returns {{ [productID: string]: Array<string> }} - product - categories pair
     */
    getPredefinedProductsByCategories(specificConfigs) {
        return Object
            .entries(specificConfigs)
            .reduce((accumulator, [category, config]) => {
                if (typeof config !== 'string') {
                    Object.values(config).forEach(option => {
                        if (option instanceof Array) {
                            option.forEach(productID => {
                                if (!accumulator[productID]) {
                                    accumulator[productID] = [];
                                }

                                accumulator[productID] = [
                                    ...accumulator[productID],
                                    category
                                ];
                            });
                        }
                    })
                }

                return accumulator;
            }, {});
    }
}
