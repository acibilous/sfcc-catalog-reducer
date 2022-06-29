import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';
import { formatToFixed } from '#tools/logger.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} allReducedProducts
 * @param {Array<string>} nonMasters
 * @param {number | false} [defaultAmount]
 */
export default async (files, allReducedProducts, nonMasters, defaultAmount) => {
    const savedProducts = [];

    for (let index = 0; index < files.length; index++) {
        const priceBookFile = files[index];

        const priceBookFilterWritter = new XMLFilterWriter(priceBookFile, getPostfixFile(priceBookFile))
            .setName('Pricebook reducer-writer');

        /**
         * If it's the last file
         */
        if (index === files.length - 1) {
            priceBookFilterWritter.on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
                if (typeof defaultAmount !== 'number') {
                    return;
                }

                for (let i = 0; i < nonMasters.length; i++) {
                    const productID = nonMasters[i];

                    if (!savedProducts.includes(productID)) {
                        writer.write(`\t<price-table product-id="${productID}">\n\t\t<amount quantity="1">${formatToFixed(defaultAmount, 2)}</amount>\n\t</price-table>\n`);
                    }
                }
                
            })
        }
    
        await priceBookFilterWritter.startAsync('price-table', (/** @type {import('#types').XMLTag} */ tag) => {
            const { 'product-id': productID } = tag.attributes;
    
            const shouldBeSaved = allReducedProducts.includes(productID);
    
            if (shouldBeSaved && typeof defaultAmount === 'number') {
                savedProducts.push(productID);
            }
    
            return shouldBeSaved;
        });
    }
}
