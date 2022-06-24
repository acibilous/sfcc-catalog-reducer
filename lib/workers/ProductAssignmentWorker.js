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
         * @type {{ [productID: string]: string }}
         */
        const result = {};

        await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file).setName(`Categories parser`);

            await matcher.startAsync('category-assignment', ({ attributes }) => {
                if (categoriesIDs.includes(attributes['category-id'])) {
                    result[attributes['product-id']] = attributes['category-id'];
                }
            });
        }));

        return result;
    }
}
