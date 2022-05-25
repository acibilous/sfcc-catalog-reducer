const Types = require('../types');

/**
 * @param {Array<string> | { [id: string]: any }} IDsContainer
 * @returns {(tag: Types.XMLTag) => boolean}
 */
const getFilterByProductID = (IDsContainer) => {
    return (/** @type {Types.XMLTag} */ tag) => {
        const id = tag.attributes['product-id'];

        return id in IDsContainer;
    };
}

module.exports.getFilterByProductID = getFilterByProductID;
