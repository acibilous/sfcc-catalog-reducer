const Types = require('../../types');

const CatalogWorker = require('./CatalogWorker');
const NavigationCategoriesRegistry = require('../registry/NavigationCategoriesRegistry');

const parentXMLRegex = /<parent>(.+?)<\/parent>/;

/**
 * @extends {CatalogWorker<NavigationCategoriesRegistry>}
 */
module.exports = class NavigationAssignmentsWorker extends CatalogWorker {
    /**
     * @param {string} filePath
     */
    constructor (filePath) {
        super(filePath, NavigationCategoriesRegistry);
    }

    get parsingTag () {
        return 'category';
    }

    initEvents () {
        super.initEvents();

        this.on('match', (/** @type {Types.XMLTag} */ tagData, /** @type {string} */ raw) => {
            const { attributes } = tagData;

            const categoryId =  attributes['category-id'];

            const parentId = this.getParentIdFromRaw(raw);

            this.registry.addCategory(categoryId, parentId);
        });
    }

    /**
     * @param {string} raw
     */
    getParentIdFromRaw(raw) {
        const result = parentXMLRegex.exec(raw);

        if (result) {
            return result[1];
        }

        return null;
    }
};