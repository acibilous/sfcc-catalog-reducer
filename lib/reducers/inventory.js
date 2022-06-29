import XMLFilterWriter from '#xml/XMLFilterWriter.js';
import { getPostfixFile } from '#tools/files.js';

/**
 * @param {Array<string>} files
 * @param {Array<string>} allReducedProducts
 * @param {Array<string>} nonMasters
 * @param {number | false} [defaultStockAmount]
 */
export default async (files, allReducedProducts, nonMasters, defaultAmount) => {
    const savedProducts = [];

    for (let index = 0; index < files.length; index++) {
        const inventoryFile = files[index];

        const inventoryFilterWritter = new XMLFilterWriter(inventoryFile, getPostfixFile(inventoryFile))
            .setName('Inventory reducer-writer');

        /**
         * If it's the last file
         */
        if (index === files.length - 1) {
            inventoryFilterWritter.on('afterLastMatch', (/** @type {import('fs').WriteStream} */ writer) => {
                if (typeof defaultAmount !== 'number') {
                    return;
                }

                for (let i = 0; i < nonMasters.length; i++) {
                    const productID = nonMasters[i];

                    if (!savedProducts.includes(productID)) {
                        writer.write(`\t<record product-id="${productID}">\n\t\t<allocation>${defaultAmount}.0</allocation>\n\t\t<perpetual>false</perpetual>\n\t\t<preorder-backorder-handling>none</preorder-backorder-handling>\n\t</record>\n`);
                    }
                }
                
            })
        }
    
        await inventoryFilterWritter.startAsync('record', (/** @type {import('#types').XMLTag} */ tag) => {
            const { 'product-id': productID } = tag.attributes;
    
            const shouldBeSaved = allReducedProducts.includes(productID);
    
            if (shouldBeSaved && typeof defaultAmount === 'number') {
                savedProducts.push(productID);
            }
    
            return shouldBeSaved;
        });
    }
}
