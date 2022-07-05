import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';
import { getFilterForRecommendationTag } from '#tools/filters.js';

/**
 * @param {Array<string>} files
 * @param {Set<string>} keepAsItIsProducts
 * @param {Array<string>} categorizedProducts
 * @param {Array<string>} defaultProducts
 * @param {Array<string>} defaultCategories - categories that should use $default confing
 */
export default async (files, keepAsItIsProducts, categorizedProducts, defaultProducts, defaultCategories) => {
    /**
     * @param {string} ID - product ID
     */
    const shouldProductBeSaved = (ID) => {
        return categorizedProducts.includes(ID) || defaultProducts.includes(ID) || keepAsItIsProducts.has(ID);
    };

    const recommendationFilter = getFilterForRecommendationTag(shouldProductBeSaved);

    /**
     * @type {{ [categoryID: string]: Array<string> }}
     */
    const savedProducts = {};

    for (let index = 0; index < files.length; index++) {
        const navigationFile = files[index];

        const outFile = getPostfixFile(navigationFile);

        const navigationFilterWriter = new XMLFilterWriter(navigationFile, outFile)
            .setName('Navigation reducer-writer');

        /**
         * If it's the last file
         */
        if (index === files.length - 1) {
            /**
             * Appending missing default assignments
             */
            navigationFilterWriter.on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
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

        await navigationFilterWriter.startAsync('category-assignment', 'recommendation', /** @type {import('#types').XMLTagFilter} */(tag) => {
            if (tag.name === 'recommendation') {
                return recommendationFilter(tag);
            }

            const {
                'category-id': categoryID,
                'product-id': productID
            } = tag.attributes;

            const shouldBeSaved = shouldProductBeSaved(productID);

            if (shouldBeSaved) {
                savedProducts[categoryID] = savedProducts[categoryID] || [];

                savedProducts[categoryID].push(productID);
            }

            return shouldBeSaved;
        });
    }
};
