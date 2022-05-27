import Types from '../types.js';

/**
 * @param {Array<string> | { [id: string]: any }} IDsContainer
 * @returns {(tag: Types.XMLTag) => boolean}
 */
export const getFilterByProductID = (IDsContainer) => {
    return (/** @type {Types.XMLTag} */ tag) => {
        const id = tag.attributes['product-id'];

        return id in IDsContainer;
    };
}
