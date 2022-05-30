
/**
 * @param {Array<string> | { [id: string]: any }} IDsContainer
 * @returns {(tag: import('#types').XMLTag) => boolean}
 */
export const getFilterByProductID = (IDsContainer) => {
    return (/** @type {import('#types').XMLTag} */ tag) => {
        const id = tag.attributes['product-id'];

        return id in IDsContainer;
    };
}
