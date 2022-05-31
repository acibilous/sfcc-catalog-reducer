import NavigationCategoriesRegistry from '../../catalog/registry/NavigationCategoriesRegistry.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';
import { getPostfixFile, getFilesByPatterns } from '../files.js';

/**
 * @param {import('#types').XMLFilterWriter} productFilter
 * @param {Array<string>} files
 * @param {Array<string>} usedOnlyCategories
 * @param {NavigationCategoriesRegistry} categoriesRegistry
 */
export default async (productFilter, files, usedOnlyCategories, categoriesRegistry) => {
    const usedCategoriesWithParents = categoriesRegistry.filterCategories(usedOnlyCategories);

    return Promise.all(
        files.map(async (navigationFile) => {
            const outFile = getPostfixFile(navigationFile);

            const tempFileWithFilteredProducts = outFile + '.temp';

            const navigationFilterByProducts = new XMLFilterWriter(navigationFile, tempFileWithFilteredProducts);

            await navigationFilterByProducts.startAsync('category-assignment', productFilter);

            const navigationFilterByCategories = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

            return navigationFilterByCategories.startAsync('category', tag => {
                const categoryId = tag.attributes['category-id'];

                return usedCategoriesWithParents.includes(categoryId);
            });
        }
    ));
}
