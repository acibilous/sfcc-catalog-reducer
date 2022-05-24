#!/usr/bin/env node

const NavigationCategoriesWorker = require('./lib/catalog/workers/NavigationCategoriesWorker');
const NavigationAssignmentsWorker = require('./lib/catalog/workers/NavigationAssignmentsWorker');
const MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker');
const XMLFilterWriter = require('./lib/xml/XMLFilterWriter');
const { getCleaner } = require('./lib/tools/cleanup');

const catalogReducer = require('./constants').catalogReducer;

const {
    productsConfig,
    categoriesConfig,
    src
} = catalogReducer;

const cleanupFolders = getCleaner(src);

if (!catalogReducer.enabledCache) {
    cleanupFolders();
}

const categoriesWorker = new NavigationCategoriesWorker(src.navigation);
const assignmentsWorker = new NavigationAssignmentsWorker(src.navigation);
const masterWorker = new MasterCatalogWorker(src.master);

const filterProductByNavigationRegistry = (/** @type {Types.XMLTag} */ tag) => {
    const id = tag.attributes['product-id'];
    const { finalProductList } = assignmentsWorker.registry.cache;

    return id in finalProductList;
}

/**
 * @description Entry point
 */
(async () => {
    console.time('Done in');

    /**
     * Parsing all required data
     */
    await Promise.all([
        masterWorker.startAsync(),
        assignmentsWorker.startAsync(),
        categoriesWorker.startAsync()
    ]);

    /**
     * Adding dependencies to navigation catalog registry. Product may be not category assignment
     * but his owner assigned to navigation catalog
     */
    assignmentsWorker.registry.updateProducts(masterWorker.registry.cache.products);

    /**
     * We have all needed data, so we don't need master catalog registry
     */
    masterWorker.destroy();

    /**
     * Now we may reduce catalog data by configuration
     */
    assignmentsWorker.registry.optimize(categoriesConfig, productsConfig);

    const tempMinifiedMasterWithFilteredProducts = src.minifiedMaster + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(src.master, tempMinifiedMasterWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', filterProductByNavigationRegistry);

    const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, src.minifiedMaster);

    masterFilterByAssignments.startAsync('category-assignment', filterProductByNavigationRegistry);

    const tempMinifiedNavigationWithFilteredProducts = src.minifiedNavigation + '.temp';

    const navigationFilterByProducts = new XMLFilterWriter(src.navigation, tempMinifiedNavigationWithFilteredProducts);

    await navigationFilterByProducts.startAsync('category-assignment', filterProductByNavigationRegistry);

    const navigationFilterByCategories = new XMLFilterWriter(tempMinifiedNavigationWithFilteredProducts, src.minifiedNavigation);

    const onlyUsedCategories = assignmentsWorker.registry.getFinalUsedCategories();

    const usedCategoriesWithParents = categoriesWorker.registry.filterCategories(onlyUsedCategories);

    await navigationFilterByCategories.startAsync('category', tag => {
        const categoryId = tag.attributes['category-id'];

        return usedCategoriesWithParents.includes(categoryId);
    });

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
