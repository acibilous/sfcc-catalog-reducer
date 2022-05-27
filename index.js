#!/usr/bin/env node

const NavigationCategoriesWorker = require('./lib/catalog/workers/NavigationCategoriesWorker');
const NavigationAssignmentsWorker = require('./lib/catalog/workers/NavigationAssignmentsWorker');
const MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker');

const { getCleaner, renameReducedToOriginal } = require('./lib/tools/cleanup');

const { catalogReducer } = require('./constants');
const getReducers = require('./lib/tools/reducers');

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

    const reducers = getReducers(assignmentsWorker.registry.cache.finalProductList, src);

    await Promise.all([
        reducers.master(),
        reducers.navigation(assignmentsWorker, categoriesWorker),
        reducers.inventory(),
        reducers.priceBook()
    ]);

    if (catalogReducer.behaviour === 'updateExisting') {
        await renameReducedToOriginal(src);
    }

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
