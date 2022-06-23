import XMLMatcher from '#xml/XMLMatcher.js'

 
export default class ProductAssignmentWorker {
    /**
     * @param {Array<string>} assignmentCatalogs 
     */
    constructor(assignmentCatalogs) {
        this.assignmentCatalogs = assignmentCatalogs;
    }

    /**
     * @deprecated
     * @param {string} categoryID 
     * @returns IDs of products assigned to the category
     */
    async parseCategory(categoryID) {
        const matchesArrays = await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file).setName(`Category parser [${categoryID}]`);

            const productIDs = /** @type {Array<string>} */ ([]);

            await matcher.startAsync('category-assignment', ({ attributes }) => {
                if (attributes['category-id'] === categoryID) {
                    productIDs.push(attributes['product-id']);
                }
            });

            return productIDs;
        }));

        return matchesArrays.flat();
    }

    /**
     * @param {Array<string>} categoriesIDs 
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

// new ProductAssignmentWorker([
//     './testdata/navigation/navigation1.xml',
//     './testdata/navigation/navigation2.xml'
// ]).parseCategory('deals').then(console.log);
