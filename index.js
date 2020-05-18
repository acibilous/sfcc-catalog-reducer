#!/usr/bin/env node

const
    path = require('path'),
    config = require(path.join(process.cwd(), 'package.json')),
    catalogReducer = config.catalogReducer || require('./default'),
    minifiedMaster = catalogReducer.src.minifiedMaster,
    masterCatalogFile = catalogReducer.src.master,
    masterFolder = path.dirname(masterCatalogFile),
    navigationCatalogFile = catalogReducer.src.navigation,
    navigationFolder = path.dirname(navigationCatalogFile),
    categoriesConfiguration = catalogReducer.categoriesConfig,
    productsConfig = catalogReducer.productsConfig,
    NavigationCatalogWorker = require('./lib/catalog/workers/NavigationCatalogWorker'),
    MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker'),
    MasterCatalogFilter = require('./lib/catalog/workers/MasterCatalogFilter'),
    { removeFilesExcept } = require('./lib/tools/cleanup'),
    { log } = require('./lib/tools/logger');

if (!catalogReducer.enabledCache) {
    cleanupFolders();
}


let
    navigationWorker = new NavigationCatalogWorker(navigationCatalogFile),
    masterWorker = new MasterCatalogWorker(masterCatalogFile),
    masterCatalogFilter = new MasterCatalogFilter(masterCatalogFile, minifiedMaster + '.temp');

/**
 * Filter product by final registry in navigation catalog
 */
masterCatalogFilter.setMatchFilter(tag => {
    let
        id = tag.attributes['product-id'],
        { finalProductList } = navigationWorker.registry;
    
    return !!finalProductList[id];
});

/**
 * when finished first parsing of master catalog we need to start parsing of navigation catalog
 */
masterWorker.on('end', () => navigationWorker.start());

/**
 * when finished parsing of navigation catalog we know which products assigned to which categories
 */
navigationWorker.on('end', () => {
    /**
     * Adding dependendencies to navigation catalog registry. Product may be not category assignement
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
    navigationWorker.registry.optimize(categoriesConfiguration, productsConfig);

    /**
     * We have info about all products that we need in navigation worker.
     * Now we may read master catalog again and write to optimized file
     * only products that existing in navigation catalog worker registry.
     */
    masterCatalogFilter.start().on('end', () => {
        let masterCatalogAssignmentsFilter = new MasterCatalogFilter(minifiedMaster + '.temp', minifiedMaster);

        masterCatalogAssignmentsFilter.setMatchFilter(tag => {
            let
                id = tag.attributes['product-id'],
                { finalProductList } = navigationWorker.registry;

            return !!finalProductList[id];
        });

        masterCatalogAssignmentsFilter.start('category-assignment').on('end', () => {
            if (catalogReducer.cleanupData) {
                cleanupFolders();
            }

            log('Done');
        });
    });
});

//first parsing master catalog to collect products with their dependencies
masterWorker.start();

function cleanupFolders () {
    log(`Cleanup folders ${masterFolder} and ${navigationFolder}`);
    removeFilesExcept(masterFolder, [masterCatalogFile, navigationCatalogFile, minifiedMaster]);
    removeFilesExcept(navigationFolder, [masterCatalogFile, navigationCatalogFile, minifiedMaster]);
}