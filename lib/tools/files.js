const Types = require('../types');

const fs = require('fs');
const path = require('path');

const XMLExtensionLength = '.xml'.length;

/**
 * @param {string} str
 */
const withoutXMLExtension = (str) => {
    return str.slice(0, str.length - XMLExtensionLength);
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
    Object.keys(src).filter(key => !key.includes('minified') && !key.includes('Dir')).forEach(key => {
        const minKey = 'minified' + capitalizeFirstLetter(key);

        src[minKey] = src[minKey] || withoutXMLExtension(src[key]) + defaultMinEnding;
    })
}

/**
 * @param {string} file
 * @param {string} defaultMinEnding
 */
module.exports.getMinifieldFile = (file, defaultMinEnding) => {
    return withoutXMLExtension(file) + defaultMinEnding;
}

/**
 * @param {string} dir
 * @param {(file: string) => boolean} filter
 */
module.exports.getXMLFilesList = async (dir, filter) => {
    const files = await fs.promises.readdir(dir);

    const xmlFiles = files.filter(
        file => file.slice(file.length - XMLExtensionLength, file.length) === '.xml'
    );

    return xmlFiles.filter(filter).map(file => path.join(dir, file));
}
