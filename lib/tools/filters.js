
/**
 * @param {Array<string>} IDsContainer
 * @returns {(tag: import('#types').XMLTag) => boolean}
 */
export const getFilterByProductID = (IDsContainer) => {
    return (/** @type {import('#types').XMLTag} */ tag) => {
        const id = tag.attributes['product-id'];

        return IDsContainer.includes(id);
    };
}

/**
 * @param {(productID: string) => boolean} shouldProductBeSaved 
 */
export const getFilterForRecommendationTag = (shouldProductBeSaved) => {
    return (/** @type {import('#types').XMLTag} */ tag) => {
        const {
            'source-id': sourceID,
            'target-id': targetID
        } = tag.attributes;

        return shouldProductBeSaved(sourceID) && shouldProductBeSaved(targetID);
    }
}
