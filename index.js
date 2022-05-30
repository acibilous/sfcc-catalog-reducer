#!/usr/bin/env node

import NavigationCategoriesWorker from './lib/catalog/workers/NavigationCategoriesWorker.js';
import NavigationAssignmentsWorker from './lib/catalog/workers/NavigationAssignmentsWorker.js';
import MasterCatalogWorker from './lib/catalog/workers/MasterCatalogWorker.js';

import NavigationAssignmentsRegistry from './lib/catalog/registry/NavigationAssignmentsRegistry.js';
import NavigationCategoriesRegistry from './lib/catalog/registry/NavigationCategoriesRegistry.js';

import { getCleaner, renameReducedToOriginal } from './lib/tools/cleanup.js';
import { getFilesByPatterns } from './lib/tools/files.js';

import { catalogReducer } from './constants.js';
import getReducers from './lib/tools/reducers.js';

const {
    productsConfig,
    categoriesConfig,
    src
} = catalogReducer;

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

    const categoriesWorkers = (await getFilesByPatterns(src.navigations)).map(file => new NavigationCategoriesWorker(file));
    const assignmentsWorkers = (await getFilesByPatterns(src.navigations)).map(file => new NavigationAssignmentsWorker(file));

    /**
     * Parsing all required data
     */
    await Promise.all([
        masterWorker.startAsync(),
        assignmentsWorkers.map(worker => worker.startAsync()),
        categoriesWorkers.map(worker => worker.startAsync())
    ]);

    const singleCategoryRegistry = new NavigationCategoriesRegistry(process.cwd());
    const singleAssignmentRegistry = new NavigationAssignmentsRegistry(process.cwd());

    singleAssignmentRegistry.appendCategories(assignmentsWorkers.map(worker => worker.registry.cache.categories));
    singleCategoryRegistry.appendCategoriesParrents(categoriesWorkers.map(worker => worker.registry.cache.categoriesParents));


    /**
     * Adding dependencies to navigation catalog registry. Product may be not category assignment
     * but his owner assigned to navigation catalog
     */
    singleAssignmentRegistry.updateProducts(masterWorker.registry.cache.products);



    /**
     * We have all needed data, so we don't need master catalog registry
     */
    masterWorker.destroy();

    /**
     * Now we may reduce catalog data by configuration
     */
    singleAssignmentRegistry.optimize(categoriesConfig, productsConfig);

    const reducers = getReducers(singleAssignmentRegistry.cache.finalProductList, src);

    await Promise.all([
        reducers.master(),
        reducers.navigation(singleAssignmentRegistry.getFinalUsedCategories(), singleCategoryRegistry),
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
