import fs from 'fs';
import path from 'path';
import { catalogReducer } from '../../constants.js';

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
export const getPostfixFile = (file) => {
    return withoutXMLExtension(file) + endingPart;
};

export const removePostfix = (file) => {
    return withoutXMLExtension(file).slice(0, file.length - catalogReducer.outPostfix) + '.xml';
};

/**
 * @param {string} file
 */
export const isOutPostfixFile = (file) => endsWith(file, endingPart);

/**
 * @param {string} file
 * @param {string} ending
 */
export const endsWith = (file, ending) => ending.length
    ? file.slice(file.length - ending.length, file.length) === ending
    : false;

/**
 * @param {string} dir
 * @param {(file: string) => boolean} [filter]
 */
export const getXMLFilesList = async (dir, filter = () => true) => {
    const files = await fs.promises.readdir(dir);

    const xmlFiles = files.filter(
        file => file.slice(file.length - XMLExtensionLength, file.length) === '.xml'
    );

    return xmlFiles.filter(filter).map(file => path.join(dir, file));
};
