import { getPostfixFile } from '../files.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map((inventoryFile) => {
    const inventoryFilterByProduct = new XMLFilterWriter(inventoryFile, getPostfixFile(inventoryFile));

    return inventoryFilterByProduct.startAsync('record', productFilter);
}));
