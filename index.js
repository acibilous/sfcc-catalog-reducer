#!/usr/bin/env node

import NavigationCategoriesWorker from './lib/catalog/workers/NavigationCategoriesWorker.js';
import NavigationAssignmentsWorker from './lib/catalog/workers/NavigationAssignmentsWorker.js';
import MasterCatalogWorker from './lib/catalog/workers/MasterCatalogWorker.js';

import MasterCatalogRegistry from './lib/catalog/registry/MasterCatalogRegistry.js';
import NavigationAssignmentsRegistry from './lib/catalog/registry/NavigationAssignmentsRegistry.js';
import NavigationCategoriesRegistry from './lib/catalog/registry/NavigationCategoriesRegistry.js';

import reducers from './lib/tools/reducers/index.js';
import { getCleaner, renameReducedToOriginal } from './lib/tools/cleanup.js';
import { getFilesByPatterns } from './lib/tools/files.js';
import { getFilterByProductID } from './lib/tools/filters.js';

import { catalogReducer } from './constants.js';

const {
    productsConfig,
    categoriesConfig,
    src
} = catalogReducer;

/**
 * @description Entry point
 */
(async () => {
    console.time('Done in');

    const [masterFiles, navigationFiles, inventoryFiles, priceBookFiles] = await Promise.all([
        getFilesByPatterns(src.masters),
        getFilesByPatterns(src.navigations),
        getFilesByPatterns(src.inventories),
        getFilesByPatterns(src.priceBooks)
    ]);

    const inputFiles = [
        ...masterFiles,
        ...navigationFiles,
        ...inventoryFiles,
        ...priceBookFiles
    ];

    const cleanupFolders = await getCleaner(inputFiles);

    if (!catalogReducer.enabledCache) {
        cleanupFolders();
    }

    const masterWorkers = masterFiles.map(file => new MasterCatalogWorker(file));
    const categoriesWorkers = navigationFiles.map(file => new NavigationCategoriesWorker(file));
    const assignmentsWorkers = navigationFiles.map(file => new NavigationAssignmentsWorker(file));

    /**
     * Parsing all required data
     */
    await Promise.all([
        ...masterWorkers.map(worker => worker.startAsync()),
        ...assignmentsWorkers.map(worker => worker.startAsync()),
        ...categoriesWorkers.map(worker => worker.startAsync())
    ]);

    const singleMasterRegistry = new MasterCatalogRegistry(process.cwd());
    const singleCategoryRegistry = new NavigationCategoriesRegistry(process.cwd());
    const singleAssignmentRegistry = new NavigationAssignmentsRegistry(process.cwd());

    singleMasterRegistry.appendProducts(masterWorkers.map(worker => worker.registry.cache.products));
    singleAssignmentRegistry.appendCategories(assignmentsWorkers.map(worker => worker.registry.cache.categories));
    singleCategoryRegistry.appendCategoriesParrents(categoriesWorkers.map(worker => worker.registry.cache.categoriesParents));

    /**
     * Adding dependencies to navigation catalog registry. Product may be not category assignment
     * but his owner assigned to navigation catalog
     */
    singleAssignmentRegistry.updateProducts(singleMasterRegistry.cache.products);

    /**
     * We have all needed data, so we don't need master catalog registry
     */
    masterWorkers.forEach(worker => worker.destroy());

    /**
     * Now we may reduce catalog data by configuration
     */
    singleAssignmentRegistry.optimize(categoriesConfig, productsConfig);

    const productFilter = getFilterByProductID(singleAssignmentRegistry.cache.finalProductList);

    await Promise.all([
        reducers.master(productFilter, masterFiles),
        reducers.inventory(productFilter, inventoryFiles),
        reducers.priceBook(productFilter, priceBookFiles),
        reducers.navigation(
            productFilter,
            navigationFiles,
            singleAssignmentRegistry.getFinalUsedCategories(),
            singleCategoryRegistry
        )
    ]);

    if (catalogReducer.behavior === 'updateExisting') {
        await renameReducedToOriginal(inputFiles);
    }

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
