import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {import('#types').XMLTagFilter} productFilter
 * @param {Array<string>} files
 */
export default async (productFilter, files) => Promise.all(files.map(async (masterFile) => {
    const outFile = getPostfixFile(masterFile);

    const masterFilter = new XMLFilterWriter(masterFile, outFile)
        .setName('Master reducer-writer');
 
    await masterFilter.startAsync('product', 'category-assignment', productFilter);
}));
