const CatalogWorker = require('./CatalogWorker');
const NavigationCatalogRegistry = require('../registry/NavigationCatalogRegistry');

module.exports = class NavigationCatalogWorker extends CatalogWorker {
    constructor (filepath) {
        super(filepath);

        this.registry = new NavigationCatalogRegistry(this.folder);
        this.initEvents();
    }

    get parsingTag () {
        return 'category-assignment';
    }

    initEvents () {
        this.on('match', tagData => {
            const { attributes } = tagData;
            const categoryId = attributes['category-id'];
            const productId = attributes['product-id'];

            this.registry.addCategoryAssignment(categoryId, productId);
        })
            .on('end', () => {
                this.registry.writeCache();
            });
    }
};
