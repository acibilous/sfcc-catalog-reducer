import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';
import { getFilterForRecommendationTag } from '#tools/filters.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} keepAsIsCategories
 * @param {object} products
 * @param {Record<string, Array<string>>} products.categorized
 * @param {Array<string>} products.default
 * @param {Array<string>} products.dependent
 * @param {Array<string>} defaultCategories - categories that should use $default config
 */
export default async (
    files,
    keepAsIsCategories,
    products,
    defaultCategories
) => {
    /**
     * @param {string} ID - product ID
     * @param {string} categoryID - category ID
     */
    const shouldProductBeSaved = (ID, categoryID) => {
        return keepAsIsCategories.includes(categoryID) || products.categorized[categoryID]?.includes(ID)
    };

    const shouldRecommendationBeSaved = getFilterForRecommendationTag(shouldProductBeSaved);

    /**
     * @type {{ [categoryID: string]: Array<string> }}
     */
    const savedProducts = {};

    /**
     * @type {Set<string>} array of full raw tag that should be kept
     */
    const filteredRecommendations = new Set();

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
                    for (const productID of products.default) {
                        /* if a product have dependency to it's master product (i.e. is a variation, etc.) -
                         * assignment record for the variation product should not be created, only for the master
                         */
                        if (products.dependent.includes(productID)) {
                            continue;
                        }

                        if (!savedProducts[category] || !savedProducts[category].includes(productID)) {
                            savedProducts[category] = savedProducts[category] || [];
                            savedProducts[category].push(productID);
                            writer.write(`\t<category-assignment category-id="${category}" product-id="${productID}"/>\n`);
                        }
                    }
                }

                for (const recommendation of filteredRecommendations) {
                    writer.write(`\t${recommendation}\n`);
                }
            });
        }

        await navigationFilterWriter.startAsync('category-assignment', 'recommendation', /** @type {import('#types').XMLTagFilter} */ (tag, raw) => {
            if (tag.name === 'recommendation') {
                if (shouldRecommendationBeSaved(tag)) {
                    filteredRecommendations.add(raw.trim())
                }

                return false; // should be placed after category-assignment tags section
            }

            const {
                'category-id': categoryID,
                'product-id': productID
            } = tag.attributes;

            const shouldBeSaved = shouldProductBeSaved(productID, categoryID);

            if (shouldBeSaved) {
                savedProducts[categoryID] = savedProducts[categoryID] || [];

                savedProducts[categoryID].push(productID);
            }

            return shouldBeSaved;
        });
    }
};
