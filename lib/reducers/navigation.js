import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} categorizedProducts
 * @param {Array<string>} defaultProducts
 * @param {Array<string>} defaultCategories - categories that should use $default confing
 */
export default async (files, categorizedProducts, defaultProducts, defaultCategories) => {
    /**
     * @type {{ [categoryID: string]: Array<string> }}
     */
    const savedProducts = {};

    return Promise.all(
        files.map(async (navigationFile) => {
            const outFile = getPostfixFile(navigationFile);

            const navigationFilterWritter = new XMLFilterWriter(navigationFile, outFile)
                .setName('Navigation reducer-writer')
                .on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
                    for (const category of defaultCategories) {
                        for (const productID of defaultProducts) {
                            if (!savedProducts[category] || !savedProducts[category].includes(productID)) {
                                writer.write(`\t<category-assignment category-id="${category}" product-id="${productID}"/>\n`);
                            }
                        }
                    }
                });

            await navigationFilterWritter.startAsync('category-assignment', /** @type {import('#types').XMLTagFilter} */(tag) => {
                const categoryID = tag.attributes['category-id'];
                const productID = tag.attributes['product-id'];

                const shouldBeSaved = categorizedProducts.includes(productID) || defaultProducts.includes(productID);

                if (shouldBeSaved) {
                    savedProducts[categoryID] = savedProducts[categoryID] || [];

                    savedProducts[categoryID].push(productID);
                }

                return shouldBeSaved;
            });
        }))
};
