import Types from '../../types.js';
import { getPostfixFile } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} inventoryPath
 */
export default (productFilter, inventoryPath) => async () => {
    const inventoryFilterByProduct = new XMLFilterWriter(inventoryPath, getPostfixFile(inventoryPath));

    await inventoryFilterByProduct.startAsync('record', productFilter);
};
