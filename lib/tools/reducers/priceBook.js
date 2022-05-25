const Types = require('../../types');
const { getPostfixFile, getXMLFilesList } = require('../files');
const { catalogReducer } = require('../../../constants');

const XMLFilterWriter = require('../../xml/XMLFilterWriter');

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} pricebooksDir
 */
module.exports = (productFilter, pricebooksDir) => async () => {
    const priceBooks = await getXMLFilesList(pricebooksDir, f => !f.includes(catalogReducer.outPostfix + '.xml'));

    return Promise.all(priceBooks.map((file) => {
        const outFile = getPostfixFile(file);

        const priceFilterByProduct = new XMLFilterWriter(file, outFile);

        return priceFilterByProduct.startAsync('price-table', productFilter);
    }));
}
