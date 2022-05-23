#!/usr/bin/env node

const path = require('path');
const config = require(path.join(process.cwd(), 'package.json'));

const NavigationCatalogWorker = require('./lib/catalog/workers/NavigationCatalogWorker');
const MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker');
const XMLFilterWriter = require('./lib/xml/XMLFilterWriter');
const { getCleaner } = require('./lib/tools/cleanup');
const { log } = require('./lib/tools/logger');

const catalogReducer = config.catalogReducer || require('./default.json');

const {
    productsConfig,
    categoriesConfig,
    src: {
        master: masterPath,
        minifiedMaster: minifiedMasterPath,
        navigation: navigationPath
    }
} = catalogReducer;

const cleanupFolders = getCleaner({
    masterPath,
    navigationPath,
    minifiedMasterPath
});

if (!catalogReducer.enabledCache) {
    cleanupFolders();
}

const navigationWorker = new NavigationCatalogWorker(navigationPath);
const masterWorker = new MasterCatalogWorker(masterPath);

/**
 * when finished first parsing of master catalog we need to start parsing of navigation catalog
 */
masterWorker.on('end', () => navigationWorker.start());

/**
 * when finished parsing of navigation catalog we know which products assigned to which categories
 */
navigationWorker.on('end', () => {
    /**
     * Adding dependencies to navigation catalog registry. Product may be not category assignment
     * but his owner assigned to navigation catalog
     */
    navigationWorker.registry.updateProducts(masterWorker.registry.products);

    /**
     * We have all needed data, so we don't need master catalog registry
     */
    masterWorker.destroy();

    /**
     * Now we may reduce catalog data by configuration
     */
    navigationWorker.registry.optimize(categoriesConfig, productsConfig);

    const tempMinifiedMasterWithFilteredProducts = minifiedMasterPath + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterPath, tempMinifiedMasterWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    masterFilterByProduct.setMatchFilter(tag => {
        const id = tag.attributes['product-id'];
        const { finalProductList } = navigationWorker.registry;

        return id in finalProductList;
    });

    /**
     * We have info about all products that we need in navigation worker.
     * Now we may read master catalog again and write to optimized file
     * only products that existing in navigation catalog worker registry.
     */
    masterFilterByProduct.start().on('end', () => {
        const masterFilterByAssignments = new XMLFilterWriter(tempMinifiedMasterWithFilteredProducts, minifiedMasterPath);

        masterFilterByAssignments.setMatchFilter(tag => {
            const id = tag.attributes['product-id'];
            const { finalProductList } = navigationWorker.registry;

            return !!finalProductList[id];
        });

        masterFilterByAssignments.start('category-assignment').on('end', () => {
            if (catalogReducer.cleanupData) {
                cleanupFolders();
            }

            log('Done');
        });
    });
});

/**
 * first parsing master catalog to collect products with their dependencies
 */
masterWorker.start();
