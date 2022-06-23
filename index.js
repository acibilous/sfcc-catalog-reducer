#!/usr/bin/env node

import ProductAssignmentWorker from '#workers/ProductAssignmentWorker.js';
import ProductDefinitionWorker from '#workers/ProductDefinitionWorker.js';

import reducers from '#tools/reducers/index.js';
import { renameReducedToOriginal } from '#tools/cleanup.js';
import { processSrc } from '#tools/files.js';
import { getFilterByProductID } from '#tools/filters.js';
import { beep, logUsedRAM } from '#tools/logger.js';

import { src, config, specificCategoryConfigs, generalCategoryConfigs, productsConfig } from './constants.js';

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

    const isStandardProductsShouldBeProcessed = Object.values(specificCategoryConfigs).some(config => config.standard > 0) 
        || generalCategoryConfigs.$default.standard > 0;

    /**
     * @type {Set<string>}
     */
    const standardProductsForDefaultCategory = new Set();

    /**
     * @type {Set<string>}
     */
    const allReducedProductIDsForSpecificCategories = new Set();

    const productAssignmentWorker = new ProductAssignmentWorker(navigationFiles);
    const productDefinitionWorker = new ProductDefinitionWorker(masterFiles);

    const specificCategories = Object.keys(specificCategoryConfigs);

    for (const category of specificCategories) {
        const productIDs = await productAssignmentWorker.parseCategory(category);

        const [
            reducedProductIDsWithDependencies,
            unusedStandardProducts
        ] = await productDefinitionWorker.filterProducts(
            productIDs,
            specificCategoryConfigs[category],
            {
                onlineFlagCheck: productsConfig.onlineFlagCheck,
                isStandardProductsShouldBeProcessed
            }
        );

        console.log(unusedStandardProducts);

        if (standardProductsForDefaultCategory.size < specificCategoryConfigs[category].standard) {
            const amountOfStandardProductsForAdding = specificCategoryConfigs[category].standard - standardProductsForDefaultCategory.size;

            unusedStandardProducts
                .splice(0, amountOfStandardProductsForAdding)
                .forEach(productID => standardProductsForDefaultCategory.add(productID));
        }

        reducedProductIDsWithDependencies.forEach(productID => allReducedProductIDsForSpecificCategories.add(productID));
    }

    

    // const productsForUnspecifiedCategories = productDefinitionWorker.filterProducts(allReducedProductIDsForSpecificCategories, config.unspecifiedCategoryConfig);

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
