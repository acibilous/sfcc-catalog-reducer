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
     */
    async parseCaregories(categoriesIDs) {
        /**
         * @type {Set<string>}
         */
        const allCategories = new Set();

        /**
         * Record: product ID - category IDs
         * @type {{ [productID: string]: Set<string> }}
         */
        const assignments = {};

        await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file).setName(`Categories parser`);

            await matcher.startAsync('category-assignment', 'category', (/** @type {import('#types').XMLTag} */ { name, attributes }) => {
                allCategories.add(attributes['category-id']);

                if (name === 'category-assignment' && categoriesIDs.includes(attributes['category-id'])) {
                    if (!assignments[attributes['product-id']]) {
                        assignments[attributes['product-id']] = new Set();
                    }

                    assignments[attributes['product-id']].add(attributes['category-id']);
                }
            });
        }));

        return {
            allCategories,
            assignments
        };
    }
}
