import Types from '../../types.js';
import NavigationCategoriesWorker from '../../catalog/workers/NavigationCategoriesWorker.js';
import NavigationAssignmentsWorker from '../../catalog/workers/NavigationAssignmentsWorker.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';
import { getPostfixFile } from '../files.js';

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} navigationPath
 */
export default (productFilter, navigationPath) => {
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

};
