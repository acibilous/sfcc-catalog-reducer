import Types from '../../types.js';

import { getFilesByPatterns, getPostfixFile } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {Array<string>} inventoryPath
 */
export default (productFilter, pathPatternsArray) => async () => {
    const files = await getFilesByPatterns(pathPatternsArray);

    return Promise.all(files.map((inventory) => {
        const inventoryFilterByProduct = new XMLFilterWriter(inventory, getPostfixFile(inventory));

        return inventoryFilterByProduct.startAsync('record', productFilter);
    }));
};
