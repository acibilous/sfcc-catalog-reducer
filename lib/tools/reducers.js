const Types = require('../types');

const reducerCreators = require('./reducers/index');
const { getFilterByProductID } = require('./filters');

/**
 * @param {{ [productId: string]: any }} optimizedProductRegistry
 * @param {Types.SrcConfing} src
 */
module.exports = (optimizedProductRegistry, src) => {
    const filter = getFilterByProductID(optimizedProductRegistry);

    return {
        inventory: reducerCreators.inventory(filter, src.inventory),
        master: reducerCreators.master(filter, src.master),
        navigation: reducerCreators.navigation(filter, src.navigation),
        priceBook: reducerCreators.priceBook(filter, src.pricebooksDir)
    };
};
