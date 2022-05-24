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

    await masterWorker.startAsync();
    await assignmentsWorker.startAsync();

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
    masterFilterByProduct.setMatchFilter(filterProductByNavigationRegistry);

    await masterFilterByProduct.startAsync();

    const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, minifiedMasterPath);

    masterFilterByAssignments.setMatchFilter(filterProductByNavigationRegistry);

    masterFilterByAssignments.startAsync('category-assignment');

    const tempMinifiedNavigationWithFilteredProducts = minifiedNavigationPath + '.temp';

    const navigationFilterByProducts = new XMLFilterWriter(navigationPath, tempMinifiedNavigationWithFilteredProducts);

    navigationFilterByProducts.setMatchFilter(filterProductByNavigationRegistry);

    await navigationFilterByProducts.startAsync('category-assignment');

    await categoriesWorker.startAsync();

    const navigationFilterByCategories = new XMLFilterWriter(tempMinifiedNavigationWithFilteredProducts, minifiedNavigationPath);

    const onlyUsedCategories = assignmentsWorker.registry.getFinalUsedCategories();

    const usedCategoriesWithParents = categoriesWorker.registry.filterCategories(onlyUsedCategories);

    navigationFilterByCategories.setMatchFilter(tag => {
        const categoryId = tag.attributes['category-id'];

        return usedCategoriesWithParents.includes(categoryId);
    });

    await navigationFilterByCategories.startAsync('category');

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
