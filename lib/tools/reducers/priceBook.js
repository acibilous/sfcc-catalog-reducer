import Types from '../../types.js';
import { getFilesByPatterns, getPostfixFile } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {Array<string>} pricebooksDir
 */
export default (productFilter, pathPatternsArray) => async () => {
    const files = await getFilesByPatterns(pathPatternsArray);

    return Promise.all(files.map((priceBook) => {
        const priceFilterByProduct = new XMLFilterWriter(priceBook, getPostfixFile(priceBook));

        return priceFilterByProduct.startAsync('price-table', productFilter);
    }));
};
