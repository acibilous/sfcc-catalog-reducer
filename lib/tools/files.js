import fs from 'fs';
import path from 'path';
import { globby } from 'globby';

import { outPostfix, isTestEnv } from '#constants';
import { libDirectory } from './import.js';

const XMLExtensionLength = '.xml'.length;

const endingPart = outPostfix + '.xml';

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

/**
 * @param {import('#types').SrcConfig} src
 */
export const processSrc = async (src) => {
    const [masterFiles, navigationFiles, inventoryFiles, priceBookFiles] = await Promise.all([
        getFilesByPatterns(src.masters),
        getFilesByPatterns(src.navigations),
        getFilesByPatterns(src.inventories),
        getFilesByPatterns(src.priceBooks)
    ]);

    if (masterFiles.length === 0) {
        console.log('No master catalogs found');
        process.exit(0);
    }

    if (navigationFiles.length === 0) {
        console.log('No navigation catalogs found');
        process.exit(0);
    }

    const allFiles = [
        ...masterFiles,
        ...navigationFiles,
        ...inventoryFiles,
        ...priceBookFiles
    ];

    return {
        allFiles,
        masterFiles,
        navigationFiles,
        inventoryFiles,
        priceBookFiles
    }
};

/**
 * @param {Array<string>} files
 */
export const renameReducedToOriginal = async (files) => {
    return Promise.all(files.map(async (original) => {
        const reduced = getPostfixFile(original);

        await fs.promises.unlink(original);

        return fs.promises.rename(reduced, original);
    }));
}
