#!/usr/bin/env node

const Types = require('./lib/types');

const NavigationCategoriesWorker = require('./lib/catalog/workers/NavigationCategoriesWorker');
const NavigationAssignmentsWorker = require('./lib/catalog/workers/NavigationAssignmentsWorker');
const MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker');
const XMLFilterWriter = require('./lib/xml/XMLFilterWriter');
const { getCleaner } = require('./lib/tools/cleanup');
const { log } = require('./lib/tools/logger');

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
 * when finished first parsing of master catalog we need to start parsing of navigation catalog
 */
masterWorker.on('end', () => assignmentsWorker.start());

/**
 * when finished parsing of navigation catalog we know which products assigned to which categories
 */
assignmentsWorker.on('end', () => {
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

    /**
     * We have info about all products that we need in navigation worker.
     * Now we may read master catalog again and write to optimized file
     * only products that existing in navigation catalog worker registry.
     */
    masterFilterByProduct.start().on('end', () => {
        const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, minifiedMasterPath);

        masterFilterByAssignments.setMatchFilter(filterProductByNavigationRegistry);

        masterFilterByAssignments.start('category-assignment').on('end', () => {
            const tempMinifiedNavigationWithFilteredProducts = minifiedNavigationPath + '.temp';

            const navigationFilterByProducts = new XMLFilterWriter(navigationPath, tempMinifiedNavigationWithFilteredProducts);

            navigationFilterByProducts.setMatchFilter(tag => {
                const id = tag.attributes['product-id'];
                const { finalProductList } = assignmentsWorker.registry.cache;

                return !!finalProductList[id];
            });

            navigationFilterByProducts
                .start('category-assignment')
                .on('end', () => {
                    categoriesWorker.on('end', () => {
                        const navigationFilterByCategories = new XMLFilterWriter(tempMinifiedNavigationWithFilteredProducts, minifiedNavigationPath);

                        const onlyUsedCategories = assignmentsWorker.registry.getFinalUsedCategories();

                        const usedCategoriesWithParents = categoriesWorker.registry.filterCategories(onlyUsedCategories);
        
                        navigationFilterByCategories.setMatchFilter(tag => {
                            const categoryId = tag.attributes['category-id'];

                            return usedCategoriesWithParents.includes(categoryId);
                        });

                        navigationFilterByCategories
                            .start('category')
                            .on('end', () => {
                                if (catalogReducer.cleanupData) {
                                    cleanupFolders();
                                }

                                log('Done');
                            });
                    });

                    categoriesWorker.start();
                });
        });
    });
});

/**
 * first parsing master catalog to collect products with their dependencies
 */
masterWorker.start();
