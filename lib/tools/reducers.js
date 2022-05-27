import Types from '../types.js';
import reducerCreators from './reducers/index.js';
import { getFilterByProductID } from './filters.js';

/**
 * @param {{ [productId: string]: any }} optimizedProductRegistry
 * @param {Types.SrcConfing} src
 */
export default (optimizedProductRegistry, src) => {
    const filter = getFilterByProductID(optimizedProductRegistry);

    return {
        inventory: reducerCreators.inventory(filter, src.inventories),
        master: reducerCreators.master(filter, src.master),
        navigation: reducerCreators.navigation(filter, src.navigation),
        priceBook: reducerCreators.priceBook(filter, src.pricebooks)
    };
};
