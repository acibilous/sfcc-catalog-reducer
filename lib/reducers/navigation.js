import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {Array<string>} files
 * @param {Set<string>} keepAsItIsProducts
 * @param {Array<string>} categorizedProducts
 * @param {Array<string>} defaultProducts
 * @param {Array<string>} defaultCategories - categories that should use $default confing
 */
export default async (files, keepAsItIsProducts, categorizedProducts, defaultProducts, defaultCategories) => {
    /**
     * @type {{ [categoryID: string]: Array<string> }}
     */
    const savedProducts = {};

    for (let index = 0; index < files.length; index++) {
        const navigationFile = files[index];

        const outFile = getPostfixFile(navigationFile);

        const navigationFilterWritter = new XMLFilterWriter(navigationFile, outFile)
            .setName('Navigation reducer-writer');

        if (index === files.length - 1) {
            /**
             * Appending missing default assignments
             */
            navigationFilterWritter.on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
                for (const category of defaultCategories) {
                    for (const productID of defaultProducts) {
                        if (!savedProducts[category] || !savedProducts[category].includes(productID)) {
                            savedProducts[category] = savedProducts[category] || [];
                            savedProducts[category].push(productID);
                            writer.write(`\t<category-assignment category-id="${category}" product-id="${productID}"/>\n`);
                        }
                    }
                }
            });
        }

        await navigationFilterWritter.startAsync('category-assignment', /** @type {import('#types').XMLTagFilter} */(tag) => {
            const {
                'category-id': categoryID,
                'product-id': productID
            } = tag.attributes;

            const shouldBeSaved = categorizedProducts.includes(productID) || defaultProducts.includes(productID) || keepAsItIsProducts.has(productID);

            if (shouldBeSaved) {
                savedProducts[categoryID] = savedProducts[categoryID] || [];

                savedProducts[categoryID].push(productID);
            }

            return shouldBeSaved;
        });
    }
};
