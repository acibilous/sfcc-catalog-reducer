import fs from 'fs';
import path from 'path';
import { globby } from 'globby';
import { config, isTestEnv } from '../../constants.js';
import { libDirectory } from './import.js';

const XMLExtensionLength = '.xml'.length;

const endingPart = config.outPostfix + '.xml';

/**
 * @param {string} str
 */
export const withoutXMLExtension = (str) => {
    return str.slice(0, str.length - XMLExtensionLength);
};

/**
 * @param {string} file
 */
export const getPostfixFile = (file) => {
    return withoutXMLExtension(file) + endingPart;
};

/**
 * @param {string} file
 */
export const removePostfix = (file) => {
    return withoutXMLExtension(file).slice(0, file.length - config.outPostfix) + '.xml';
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

/**
 * @param {Array<string> | undefined} [pathPatternsArray]
 * @returns {Promise<Array<string>>}
 */
export const getFilesByPatterns = async (pathPatternsArray) => {
    if (!pathPatternsArray) {
        return [];
    }

    const arrayOfFilesArray = await Promise.all(
        pathPatternsArray.map(async (pattern) => {
            const resultFiles = await globby(pattern, {
                cwd: isTestEnv ? libDirectory : process.cwd()
            });

            const withoutOutFiles = resultFiles.filter(file => !isOutPostfixFile(file));

            return withoutOutFiles;
        })
    );

    const allFilesInOneArray = arrayOfFilesArray.reduce((acc, curr) => [...acc, ...curr], []);

    if (isTestEnv) {
        return allFilesInOneArray.map(file => path.join(libDirectory, file))
    }

    return allFilesInOneArray;
}

export const createFolderIfNotExists = async (path) => {
    try {
        await fs.promises.mkdir(path, { recursive: true })
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        };
    }
};
