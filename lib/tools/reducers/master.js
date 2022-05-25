const Types = require('../../types');

const { getPostfixFile } = require('../files');
const XMLFilterWriter = require('../../xml/XMLFilterWriter');

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} masterPath
 */
module.exports = (productFilter, masterPath) => async () => {
    const outFile = getPostfixFile(masterPath);

    const tempFileWithFilteredProducts = outFile + '.temp';

    const masterFilterByProduct = new XMLFilterWriter(masterPath, tempFileWithFilteredProducts);

    /**
     * Filter product by final registry in navigation catalog
     */
    await masterFilterByProduct.startAsync('product', productFilter);

    const masterFilterByAssignments = new XMLFilterWriter(tempFileWithFilteredProducts, outFile);

    await masterFilterByAssignments.startAsync('category-assignment', productFilter);
};
