import XMLMatcher from '#xml/XMLMatcher.js'

export default class ProductAssignmentWorker {
    /**
     * @param {Array<string>} assignmentCatalogs 
     */
    constructor(assignmentCatalogs) {
        this.assignmentCatalogs = assignmentCatalogs;
    }

    /**
     * @param {Array<string>} categoriesIDs 
     * @param {Array<string>} keepAsItIsCategories 
     */
    async parseCaregories(categoriesIDs, keepAsItIsCategories) {
        /**
         * @type {Set<string>}
         */
        const allCategories = new Set();

        /**
         * Record: product ID - category IDs
         * @type {{ [productID: string]: Set<string> }}
         */
        const assignments = {};

        /**
         * @type {Set<string>}
         */
        const keepAsItIsProducts = new Set();

        await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file).setName(`Categories parser`);

            await matcher.startAsync('category-assignment', 'category', (/** @type {import('#types').XMLTag} */ { name, attributes }) => {
                const {
                    'category-id': categoryID,
                    'product-id': productID
                } = attributes;

                allCategories.add(categoryID);

                if (name !== 'category-assignment') {
                    return;
                }

                if (keepAsItIsCategories.includes(categoryID)) {
                    keepAsItIsProducts.add(productID);
                    
                    delete assignments[productID];

                    return;
                }

                if (categoriesIDs.includes(categoryID)) {
                    if (!assignments[productID]) {
                        assignments[productID] = new Set();
                    }

                    assignments[productID].add(categoryID);
                }
            });
        }));

        return {
            keepAsItIsProducts,
            allCategories,
            assignments
        };
    }
}
