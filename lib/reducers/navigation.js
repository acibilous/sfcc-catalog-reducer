import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(
    files.map(async (navigationFile) => {
        const outFile = getPostfixFile(navigationFile);
    
        const navigationFilterByProducts = new XMLFilterWriter(navigationFile, outFile)
            .setName('Navigation reducer-writer');
    
        await navigationFilterByProducts.startAsync('category-assignment', productFilter);
    }
));
