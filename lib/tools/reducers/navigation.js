const Types = require('../../types');

const NavigationCategoriesWorker = require('../../catalog/workers/NavigationCategoriesWorker');
const NavigationAssignmentsWorker = require('../../catalog/workers/NavigationAssignmentsWorker');
const XMLFilterWriter = require('../../xml/XMLFilterWriter');

const { getPostfixFile } = require('../files');

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} navigationPath
 */
module.exports = (productFilter, navigationPath) => {
    /**
     * @param {NavigationAssignmentsWorker} assignmentsWorker
     * @param {NavigationCategoriesWorker} categoriesWorker
     */
    return async (assignmentsWorker, categoriesWorker) => {
        const outFile = getPostfixFile(navigationPath);

        const tempFileWithFilteredProducts = outFile + '.temp';

        const navigationFilterByProducts = new XMLFilterWriter(navigationPath, tempFileWithFilteredProducts);

        await navigationFilterByProducts.startAsync('category-assignment', productFilter);

        const navigationFilterByCategories = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

        const onlyUsedCategories = assignmentsWorker.registry.getFinalUsedCategories();

        const usedCategoriesWithParents = categoriesWorker.registry.filterCategories(onlyUsedCategories);

        await navigationFilterByCategories.startAsync('category', tag => {
            const categoryId = tag.attributes['category-id'];

            return usedCategoriesWithParents.includes(categoryId);
        });
    }

}
