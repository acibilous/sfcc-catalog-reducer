#!/usr/bin/env node

const NavigationCategoriesWorker = require('./lib/catalog/workers/NavigationCategoriesWorker');
const NavigationAssignmentsWorker = require('./lib/catalog/workers/NavigationAssignmentsWorker');
const MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker');
const XMLFilterWriter = require('./lib/xml/XMLFilterWriter');
const { getCleaner } = require('./lib/tools/cleanup');
const { getXMLFilesList, getMinifieldFile } = require('./lib/tools/files');

const { catalogReducer, defaultMinEnding } = require('./constants');

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

const filterProductByOptimizedRegistry = (/** @type {Types.XMLTag} */ tag) => {
    const id = tag.attributes['product-id'];
    const { finalProductList } = assignmentsWorker.registry.cache;

    return id in finalProductList;
}

/**
 * @param {NavigationAssignmentsWorker} assignmentsWorker
 * @param {NavigationCategoriesWorker} categoriesWorker
 */
const generanaMinifiedNavigatoin = async (assignmentsWorker, categoriesWorker) => {
    const tempMinifiedNavigationWithFilteredProducts = src.minifiedNavigation + '.temp';

    const navigationFilterByProducts = new XMLFilterWriter(src.navigation, tempMinifiedNavigationWithFilteredProducts);

    await navigationFilterByProducts.startAsync('category-assignment', filterProductByOptimizedRegistry);

    const navigationFilterByCategories = new XMLFilterWriter(tempMinifiedNavigationWithFilteredProducts, src.minifiedNavigation);

    const onlyUsedCategories = assignmentsWorker.registry.getFinalUsedCategories();

    const usedCategoriesWithParents = categoriesWorker.registry.filterCategories(onlyUsedCategories);

    await navigationFilterByCategories.startAsync('category', tag => {
        const categoryId = tag.attributes['category-id'];

        return usedCategoriesWithParents.includes(categoryId);
    });
}

const generateMinifiedMaster = async () => {
    const tempMinifiedMasterWithFilteredProducts = src.minifiedMaster + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(src.master, tempMinifiedMasterWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', filterProductByOptimizedRegistry);

    const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, src.minifiedMaster);

    await masterFilterByAssignments.startAsync('category-assignment', filterProductByOptimizedRegistry);
}

const generateMinifiedInventory = async () => {
    const inventoryFilterByProduct = new XMLFilterWriter(src.inventory, src.minifiedInventory);

    await inventoryFilterByProduct.startAsync('record', filterProductByOptimizedRegistry);
}

const generatePriceBooks = async () => {
    const priceBooks = await getXMLFilesList(src.pricebooksDir, f => !f.includes(defaultMinEnding));

    return Promise.all(priceBooks.map((file) => {
        const minFile = getMinifieldFile(file, defaultMinEnding);

        const priceFilterByProduct = new XMLFilterWriter(file, minFile);

        return priceFilterByProduct.startAsync('price-table', filterProductByOptimizedRegistry);
    }));
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

    await generateMinifiedMaster();

    await generanaMinifiedNavigatoin(assignmentsWorker, categoriesWorker);

    await generateMinifiedInventory();

    await generatePriceBooks();

    if (catalogReducer.cleanupData) {
        cleanupFolders();
    }

    console.timeEnd('Done in');
})();
