
/**
 * @param {Set<string>} IDsContainer
 * @returns {(tag: import('#types').XMLTag) => boolean}
 */
export const getFilterByProductID = (IDsContainer) => {
    return (/** @type {import('#types').XMLTag} */ tag) => {
        const id = tag.attributes['product-id'];

        return IDsContainer.has(id);
    };
}
