import { getPostfixFile } from '../files.js';
import XMLFilterWriter from '#xml/XMLFilterWriter.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map((priceBookFile) => {
    const priceFilterByProduct = new XMLFilterWriter(priceBookFile, getPostfixFile(priceBookFile))
        .setName('Reduced price book writer');

    return priceFilterByProduct.startAsync('price-table', productFilter);
}))
