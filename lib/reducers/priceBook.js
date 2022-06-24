import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map((priceBookFile) => {
    const priceFilterByProduct = new XMLFilterWriter(priceBookFile, getPostfixFile(priceBookFile))
        .setName('Pricebook reducer-writer');

    return priceFilterByProduct.startAsync('price-table', productFilter);
}))
