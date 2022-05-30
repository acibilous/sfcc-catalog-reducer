import CatalogWorker from './CatalogWorker.js';
import NavigationAssignmentsRegistry from '../registry/NavigationAssignmentsRegistry.js';

/**
 * @extends {CatalogWorker<NavigationAssignmentsRegistry>}
 */
export default class NavigationAssignmentsWorker extends CatalogWorker {
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

        this.on('match', (/** @type {import('#types').XMLTag} */ tagData, /** @type {string} */ raw) => {
            const { attributes } = tagData;
            const categoryId = attributes['category-id'];
            const productId = attributes['product-id'];

            this.registry.addCategoryAssignment(categoryId, productId);
        });
    }
};
