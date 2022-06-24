import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map(async (masterFile) => {
    const outFile = getPostfixFile(masterFile);

    const tempFileWithFilteredProducts = outFile + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterFile, tempFileWithFilteredProducts)
        .setName('Master reducer-writer (filtering by definition)');

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', productFilter);

    const masterFilterByAssignments = new XMLFilterWriter(tempFileWithFilteredProducts, outFile)
        .setName('Master reducer-writer (filtering by assignment)');

    await masterFilterByAssignments.startAsync('category-assignment', productFilter);
}));
