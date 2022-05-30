import { getPostfixFile } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {import('#types').XMLFilterWriter} productFilter
 * @param {string} masterPath
 */
export default (productFilter, masterPath) => async () => {
    const outFile = getPostfixFile(masterPath);

    const tempFileWithFilteredProducts = outFile + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterPath, tempFileWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', productFilter);

    const masterFilterByAssignments = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

    await masterFilterByAssignments.startAsync('category-assignment', productFilter);
};
