const Types = require('../types');

/**
 * @param {string} str
 */
const withoutXMLExtension = (str) => {
    const extensionLength = '.xml'.length;

    return str.slice(0, str.length - extensionLength);
};

/**
 * @param {string} str
 */
const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Sets default path for minified files it the are missing
 * @param {Types.SrcConfing} src
 * @param {string} defaultMinEnding
 */
module.exports.setDefaultMinFiles = (src, defaultMinEnding) => {
    Object.keys(src).filter(key => !key.includes('minified')).forEach(key => {
        const minKey = 'minified' + capitalizeFirstLetter(key);

        src[minKey] = src[minKey] || withoutXMLExtension(src[key]) + defaultMinEnding;
    })
}
