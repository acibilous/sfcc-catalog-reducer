const Types = require('../../types');

const CatalogWorker = require('./CatalogWorker');
const NavigationAssignmentsRegistry = require('../registry/NavigationAssignmentsRegistry');

/**
 * @extends {CatalogWorker<NavigationAssignmentsRegistry>}
 */
module.exports = class NavigationAssignmentsWorker extends CatalogWorker {
    /**
     * @param {string} filePath
     */
    constructor (filePath) {
        super(filePath, NavigationAssignmentsRegistry);
    }

    get parsingTag () {
        return 'category-assignment';
    }

    initEvents () {
        super.initEvents();

        this.on('match', (/** @type {Types.XMLTag} */ tagData, /** @type {string} */ raw) => {
            const { attributes } = tagData;
            const categoryId = attributes['category-id'];
            const productId = attributes['product-id'];

            this.registry.addCategoryAssignment(categoryId, productId);
        });
    }
};
