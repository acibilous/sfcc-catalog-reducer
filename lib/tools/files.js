const fs = require('fs');
const path = require('path');

const { catalogReducer } = require('../../constants');

const XMLExtensionLength = '.xml'.length;

const endingPart = catalogReducer.outPostfix + '.xml';

/**
 * @param {string} str
 */
const withoutXMLExtension = (str) => {
    return str.slice(0, str.length - XMLExtensionLength);
};

/**
 * @param {string} file
 */
module.exports.getPostfixFile = (file) => {
    return withoutXMLExtension(file) + endingPart;
}

/**
 * @param {string} file
 */
module.exports.isOutPostfixFile = (file) => module.exports.endsWith(file, endingPart);

/**
 * @param {string} file
 * @param {string} ending
 */
module.exports.endsWith = (file, ending) => ending.length
    ? file.slice(file.length - ending.length, file.length) === ending
    : false;

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
