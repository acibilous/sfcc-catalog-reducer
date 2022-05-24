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
    src: {
        master: masterPath,
        minifiedMaster: minifiedMasterPath,
        navigation: navigationPath,
        minifiedNavigation: minifiedNavigationPath
    }
} = catalogReducer;

const cleanupFolders = getCleaner({
    masterPath,
    navigationPath,
    minifiedMasterPath,
    minifiedNavigationPath
});

if (!catalogReducer.enabledCache) {
    cleanupFolders();
}

const categoriesWorker = new NavigationCategoriesWorker(navigationPath);
const assignmentsWorker = new NavigationAssignmentsWorker(navigationPath);
const masterWorker = new MasterCatalogWorker(masterPath);

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

    const tempMinifiedMasterWithFilteredProducts = minifiedMasterPath + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterPath, tempMinifiedMasterWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', filterProductByNavigationRegistry);

    const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, minifiedMasterPath);

    masterFilterByAssignments.startAsync('category-assignment', filterProductByNavigationRegistry);

    const tempMinifiedNavigationWithFilteredProducts = minifiedNavigationPath + '.temp';

    const navigationFilterByProducts = new XMLFilterWriter(navigationPath, tempMinifiedNavigationWithFilteredProducts);

    await navigationFilterByProducts.startAsync('category-assignment', filterProductByNavigationRegistry);

    const navigationFilterByCategories = new XMLFilterWriter(tempMinifiedNavigationWithFilteredProducts, minifiedNavigationPath);

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
