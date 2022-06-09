import XMLMatcher from '#xml/XMLMatcher.js'

 
export default class ProductAssignmentWorker {
    /**
     * @param {Array<string>} assignmentCatalogs 
     */
    constructor(assignmentCatalogs) {
        this.assignmentCatalogs = assignmentCatalogs;
    }

    /**
     * @param {string} categoryID 
     * @returns IDs of products assigned to the category
     */
    async parseCategory(categoryID) {
        const matchesArrays = await Promise.all(this.assignmentCatalogs.map(async (file) => {
            const matcher = new XMLMatcher(file);

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
}

// new ProductAssignmentWorker([
//     './testdata/navigation/navigation1.xml',
//     './testdata/navigation/navigation2.xml'
// ]).parseCategory('deals').then(console.log);
