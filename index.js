#!/usr/bin/env node

import ProductAssignmentWorker from '#workers/ProductAssignmentWorker.js';
import ProductDefinitionWorker from '#workers/ProductDefinitionWorker.js';

import reducers from '#reducers/index.js';
import { processSrc, renameReducedToOriginal } from '#tools/files.js';
import { beep, logUsedRAM } from '#tools/logger.js';

import {
    src,
    behavior,
    specificCategoryConfigs,
    generalCategoryConfigs,
    productsConfig,
    generateMissingRecords
} from './constants.js';

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
        priceBookFiles
    } = await processSrc(src);


    const productAssignmentWorker = new ProductAssignmentWorker(navigationFiles);
    const productDefinitionWorker = new ProductDefinitionWorker(masterFiles);

    const keepAsItIsCategories = Object
        .entries(specificCategoryConfigs)
        .filter(([, value]) => value === 'keepAsIs')
        .map(([category]) => category);

    const specificCategories = Object
        .keys(specificCategoryConfigs)
        .filter(category => !keepAsItIsCategories.includes(category));

    const {
        allCategories,
        assignments: specificProductIDs,
        keepAsItIsProducts
    } = await productAssignmentWorker.parseCategories(specificCategories, keepAsItIsCategories);

    const reduced = await productDefinitionWorker.filterProductsByCategories(
        specificProductIDs,
        specificCategoryConfigs,
        keepAsItIsProducts,
        generalCategoryConfigs.$default,
        productsConfig
    );

    const categoriesThatShouldUseDefaultConfig = Array
        .from(allCategories)
        .filter(category => !specificCategories.includes(category) && !keepAsItIsCategories.includes(category));

    const allReducedProducts = [...keepAsItIsProducts, ...reduced.allCategorized, ...reduced.default];

    await Promise.all([
        reducers.navigation(
            navigationFiles,
            keepAsItIsCategories,
            reduced,
            categoriesThatShouldUseDefaultConfig
        ),
        reducers.master(masterFiles, allReducedProducts),
        reducers.inventory(
            inventoryFiles,
            allReducedProducts,
            reduced.nonMasters,
            generateMissingRecords.inventoryAllocation
        ),
        reducers.priceBook(
            priceBookFiles,
            allReducedProducts,
            reduced.nonMasters,
            generateMissingRecords.price
        )
    ]);

    if (behavior === 'updateExisting') {
        await renameReducedToOriginal(allFiles);
    }

    logUsedRAM();

    console.timeEnd('Done in');

    beep();
})();
