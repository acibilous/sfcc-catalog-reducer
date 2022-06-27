#!/usr/bin/env node

import ProductAssignmentWorker from '#workers/ProductAssignmentWorker.js';
import ProductDefinitionWorker from '#workers/ProductDefinitionWorker.js';

import reducers from '#reducers/index.js';
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


    const productAssignmentWorker = new ProductAssignmentWorker(navigationFiles);
    const productDefinitionWorker = new ProductDefinitionWorker(masterFiles);

    const keepAsItIsCategories = Object
        .entries(specificCategoryConfigs)
        .filter(([, value]) => value === 'keepAsItIs')
        .map(([category]) => category);

    const specificCategories = Object
        .keys(specificCategoryConfigs)
        .filter(category => !keepAsItIsCategories.includes(category));

    const {
        allCategories,
        assignments: specificProductIDs,
        keepAsItIsProducts
    } = await productAssignmentWorker.parseCaregories(specificCategories, keepAsItIsCategories);

    const reduced = await productDefinitionWorker.filterProductsByCategories(
        specificProductIDs,
        specificCategoryConfigs,
        keepAsItIsProducts,
        generalCategoryConfigs.$default,
        productsConfig
    );

    const categoriesThatShouldUseDefaultConfing = Array
        .from(allCategories)
        .filter(category => !specificCategories.includes(category));

    const addReducedProduducts = [...keepAsItIsProducts, ...reduced.categorized, ...reduced.default];

    const productFilter = getFilterByProductID(addReducedProduducts);

    await Promise.all([
        reducers.navigation(navigationFiles, keepAsItIsProducts, reduced.categorized, reduced.default, categoriesThatShouldUseDefaultConfing),
        reducers.master(productFilter, masterFiles),
        reducers.inventory(productFilter, inventoryFiles),
        reducers.priceBook(productFilter, priceBookFiles),
    ]);

    if (config.behavior === 'updateExisting') {
        await renameReducedToOriginal(allFiles);
    }

    cleanup();

    logUsedRAM()

    console.timeEnd('Done in');

    beep();
})();
