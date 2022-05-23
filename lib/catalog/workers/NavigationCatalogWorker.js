const Types = require('../../types');

const CatalogWorker = require('./CatalogWorker');
const NavigationCatalogRegistry = require('../registry/NavigationCatalogRegistry');

/**
 * @extends {CatalogWorker<NavigationCatalogRegistry>}
 */
module.exports = class NavigationCatalogWorker extends CatalogWorker {
    /**
     * @param {string} filePath
     * @property {NavigationCatalogRegistry} registry
     */
    constructor (filePath) {
        super(filePath, NavigationCatalogRegistry);
    }

    get parsingTag () {
        return 'category-assignment';
    }

    initEvents () {
        super.initEvents();

        this.on('match', (/** @type {Types.XMLTag} */ tagData) => {
            const { attributes } = tagData;
            const categoryId = attributes['category-id'];
            const productId = attributes['product-id'];

            this.registry.addCategoryAssignment(categoryId, productId);
        });
    }
};
