#!/usr/bin/env node

import NavigationCategoriesWorker from './lib/catalog/workers/NavigationCategoriesWorker.js';
import NavigationAssignmentsWorker from './lib/catalog/workers/NavigationAssignmentsWorker.js';
import MasterCatalogWorker from './lib/catalog/workers/MasterCatalogWorker.js';

import { getCleaner, renameReducedToOriginal } from './lib/tools/cleanup.js';

import { catalogReducer } from './constants.js';
import getReducers from './lib/tools/reducers.js';

const {
    productsConfig,
    categoriesConfig,
    src
} = catalogReducer;

const categoriesWorker = new NavigationCategoriesWorker(src.navigation);
const assignmentsWorker = new NavigationAssignmentsWorker(src.navigation);
const masterWorker = new MasterCatalogWorker(src.master);

/**
 * @description Entry point
 */
(async () => {
    console.time('Done in');

    const cleanupFolders = await getCleaner(src);

    if (!catalogReducer.enabledCache) {
        cleanupFolders();
    }

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

    if (catalogReducer.behavior === 'updateExisting') {
        await renameReducedToOriginal(src);
    }

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
