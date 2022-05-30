import NavigationCategoriesRegistry from '../../catalog/registry/NavigationCategoriesRegistry.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';
import { getPostfixFile, getFilesByPatterns } from '../files.js';

/**
 * @param {import('#types').XMLFilterWriter} productFilter
 * @param {Array<string>} pathPatternsArray
 */
export default (productFilter, pathPatternsArray) => {
    /**
     * @param {Array<string>} usedOnlyCategories
     * @param {NavigationCategoriesRegistry} categoriesRegistry
     */
    return async (usedOnlyCategories, categoriesRegistry) => {
        const files = await getFilesByPatterns(pathPatternsArray);

        console.log(files);

        return Promise.all(files.map(async (navigationPath) => {
                const outFile = getPostfixFile(navigationPath);

                const tempFileWithFilteredProducts = outFile + '.temp';

                const navigationFilterByProducts = new XMLFilterWriter(navigationPath, tempFileWithFilteredProducts);

                await navigationFilterByProducts.startAsync('category-assignment', productFilter);

                const navigationFilterByCategories = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

                const usedCategoriesWithParents = categoriesRegistry.filterCategories(usedOnlyCategories);

                return navigationFilterByCategories.startAsync('category', tag => {
                    const categoryId = tag.attributes['category-id'];

                    return usedCategoriesWithParents.includes(categoryId);
                });
            }
        ));
    }
};
