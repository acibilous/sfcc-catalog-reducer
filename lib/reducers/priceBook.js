import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import XMLPricebookHeader from '#xml/XMLPricebookHeader.js';
import { getPostfixFile } from '#tools/files.js';
import { formatToFixed } from '#tools/logger.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} allReducedProducts
 * @param {Array<string>} nonMasters
 * @param {number | false} [defaultAmount]
 */
export default async (files, allReducedProducts, nonMasters, defaultAmount) => await Promise.all(
    files.map(async (priceBookFile) => {
        /**
         * @type {Array<string>}
         */
        const savedProducts = [];

        let isListPriceBook = false;

        const priceBookFilterWritter = new XMLFilterWriter(priceBookFile, getPostfixFile(priceBookFile))
            .setName('Pricebook reducer-writer');

        priceBookFilterWritter.on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
            if (!isListPriceBook || typeof defaultAmount !== 'number') {
                return;
            }

            for (let index = 0; index < nonMasters.length; index++) {
                const productID = nonMasters[index];

                if (!savedProducts.includes(productID)) {
                    writer.write(`\t<price-table product-id="${productID}">\n\t\t<amount quantity="1">${formatToFixed(defaultAmount, 2)}</amount>\n\t</price-table>\n`);
                }
                
            }
        })

        await priceBookFilterWritter.startAsync('price-table', 'header', /** @type {import('#types').XMLTagFilter} */(tag, raw) => {
            if (tag.name === 'header') {
                const header = new XMLPricebookHeader(raw);

                if (header.parent === null) {
                    isListPriceBook = true;
                }

                return true;
            }

            const { 'product-id': productID } = tag.attributes;

            const shouldBeSaved = allReducedProducts.includes(productID);

            if (shouldBeSaved && typeof defaultAmount === 'number') {
                savedProducts.push(productID);
            }

            return shouldBeSaved;
        });
    })
);
