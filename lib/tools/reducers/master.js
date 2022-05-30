import { getPostfixFile, getFilesByPatterns } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {import('#types').XMLFilterWriter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map(async (masterFile) => {
    const outFile = getPostfixFile(masterFile);

    const tempFileWithFilteredProducts = outFile + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterFile, tempFileWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', productFilter);

    const masterFilterByAssignments = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

    return masterFilterByAssignments.startAsync('category-assignment', productFilter);
}));
