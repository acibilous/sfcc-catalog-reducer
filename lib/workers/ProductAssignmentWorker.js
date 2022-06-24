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
     * @returns Record: productID - category ID 
     */
    async parseCaregories(categoriesIDs) {
        /**
         * @type {Set<string>}
         */
        const allCategories = new Set();

        /**
         * @type {{ [productID: string]: string }}
         */
        const assignments = {};

        await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file).setName(`Categories parser`);

            await matcher.startAsync('category-assignment', 'category', (/** @type {import('#types').XMLTag} */ { name, attributes }) => {
                allCategories.add(attributes['category-id']);

                if (name === 'category-assignment' && categoriesIDs.includes(attributes['category-id'])) {
                    assignments[attributes['product-id']] = attributes['category-id'];
                }
            });
        }));

        return {
            allCategories,
            assignments
        };
    }
}
