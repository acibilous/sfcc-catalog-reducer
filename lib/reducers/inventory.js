import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map((inventoryFile) => {
    const inventoryFilterByProduct = new XMLFilterWriter(inventoryFile, getPostfixFile(inventoryFile))
        .setName('Inventory reducer-writer');

    return inventoryFilterByProduct.startAsync('record', productFilter);
}));