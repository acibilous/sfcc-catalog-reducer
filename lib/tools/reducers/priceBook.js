import Types from '../../types.js';
import { getPostfixFile, getXMLFilesList } from '../files.js';
import { catalogReducer } from '../../../constants.js';
import XMLFilterWriter from '../../xml/XMLFilterWriter.js';

/**
 * @param {Types.XMLFilterWriter} productFilter
 * @param {string} pricebooksDir
 */
export default (productFilter, pricebooksDir) => async () => {
    const priceBooks = await getXMLFilesList(pricebooksDir, f => !f.includes(catalogReducer.outPostfix + '.xml'));

    return Promise.all(priceBooks.map((file) => {
        const outFile = getPostfixFile(file);

        const priceFilterByProduct = new XMLFilterWriter(file, outFile);

        return priceFilterByProduct.startAsync('price-table', productFilter);
    }));
};
