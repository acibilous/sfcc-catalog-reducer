import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';
import { getFilterByProductID } from '#tools/filters.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} allReducedProducts
 */
export default async (files, allReducedProducts) => Promise.all(files.map(async (masterFile) => {
    const productFilter = getFilterByProductID(allReducedProducts);
    const outFile = getPostfixFile(masterFile);

    const masterFilter = new XMLFilterWriter(masterFile, outFile)
        .setName('Master reducer-writer');
 
    await masterFilter.startAsync('product', 'category-assignment', productFilter);
}));
