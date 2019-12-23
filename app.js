const
    config = require(require('path').join(process.cwd(), 'package.json')),
    catalogReducer = config.catalogReducer || require('./default'),
    masterCatalogFile = catalogReducer.src.master,
    navigationCatalogFile = catalogReducer.src.navigation,
    categoriesConfiguration = catalogReducer.categoriesConfig,
    NavigationCatalogWorker = require('./lib/catalog/workers/NavigationCatalogWorker'),
    MasterCatalogWorker = require('./lib/catalog/workers/MasterCatalogWorker'),
    MasterCatalogFilter = require('./lib/catalog/workers/MasterCatalogFilter');

let
    navigationWorker = new NavigationCatalogWorker(navigationCatalogFile),
    masterWorker = new MasterCatalogWorker(masterCatalogFile),
    masterCatalogFilter = new MasterCatalogFilter(masterCatalogFile);

/**
 * Filter product by final registry in navigation catalog
 */
masterCatalogFilter.setMatchFilter(tag => {
    let
        id = tag.attributes['product-id'],
        { finalProductList } = navigationWorker.registry.finalProductList;
    
    return !!navigationWorker.registry.finalProductList[id];
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
    navigationWorker.registry.optimize(categoriesConfiguration);

    /**
     * We have info about all products that we need in navigation worker.
     * Now we may read master catalog again and write to optimized file
     * only products that existing in navigation catalog worker registry.
     */
    masterCatalogFilter.start().on('end', () => console.log('Done'));
});

//first parsing master catalog to collect products with their dependencies
masterWorker.start()