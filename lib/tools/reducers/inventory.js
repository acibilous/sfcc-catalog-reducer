const Types = require('../../types');

const { getPostfixFile } = require('../files');
const XMLFilterWriter = require('../../xml/XMLFilterWriter');

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} inventoryPath
 */
module.exports = (productFilter, inventoryPath) => async () => {
    const inventoryFilterByProduct = new XMLFilterWriter(inventoryPath, getPostfixFile(inventoryPath));

    await inventoryFilterByProduct.startAsync('record', productFilter);
}
