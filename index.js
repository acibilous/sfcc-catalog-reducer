#!/usr/bin/env node

import ProductAssignmentWorker from '#workers/ProductAssignmentWorker.js';
import ProductDefinitionWorker from '#workers/ProductDefinitionWorker.js';

import reducers from '#tools/reducers/index.js';
import { renameReducedToOriginal } from '#tools/cleanup.js';
import { processSrc } from '#tools/files.js';
import { getFilterByProductID } from '#tools/filters.js';
import { beep, logUsedRAM } from '#tools/logger.js';

import { src, specificCategoryConfigs, config } from './constants.js';

/**
 * @description Entry point
 */
(async () => {
    console.time('Done in');

    const {
        allFiles,
        masterFiles,
        navigationFiles,
        inventoryFiles,
        priceBookFiles,
        cleanup
    } = await processSrc(src);

    /**
     * @type {Set<string>}
     */
    const allReducedProductIDsForSpecificCategories = new Set();

    const productAssignmentWorker = new ProductAssignmentWorker(navigationFiles);
    const productDefinitionWorker = new ProductDefinitionWorker(masterFiles);

    const specificCategories = Object.keys(specificCategoryConfigs);

    for (const category of specificCategories) {
        const productIDs = await productAssignmentWorker.parseCategory(category);

        const reducedProductIDsWithDependencies = await productDefinitionWorker.filterProducts(productIDs, specificCategoryConfigs[category]);

        reducedProductIDsWithDependencies.forEach(productID => allReducedProductIDsForSpecificCategories.add(productID));
    }

    const productFilter = getFilterByProductID(allReducedProductIDsForSpecificCategories);

    await Promise.all([
        reducers.master(productFilter, masterFiles),
        reducers.inventory(productFilter, inventoryFiles),
        reducers.priceBook(productFilter, priceBookFiles),
        reducers.navigation(productFilter, navigationFiles)
    ]);

    if (config.behavior === 'updateExisting') {
        await renameReducedToOriginal(allFiles);
    }

    cleanup();

    logUsedRAM()

    console.timeEnd('Done in');

    beep();
})();
