const Types = require('../types');

const fs = require('fs');
const path = require('path');

const { log } = require('./logger');
const { isOutPostfixFile, getPostfixFile, getXMLFilesList } = require('./files');

/**
 * @param {string} dir - destination to the folder
 * @param {Array<string>} exclusions - files that should be excluded during removal
 * @param {(file: string) => boolean} exclusions - additional filter
 */
const removeFilesExcept = (dir, exclusions, filter) => {
    const files = fs.readdirSync(dir);

    exclusions = exclusions.map(file => path.basename(file));

    files.filter(filter).forEach(file => {
        if (!exclusions.includes(file) && file !== 'static') {
            fs.unlinkSync(path.join(dir, file))
        }
    });
};

/**
 * @param {Types.SrcConfing} originalSrc
 */
const renameReducedToOriginal = async (originalSrc) => {
    const priceBooks = await getXMLFilesList(originalSrc.pricebooksDir, f => !isOutPostfixFile(f));

    const originalPath = [
        ...priceBooks,
        originalSrc.inventory,
        originalSrc.master,
        originalSrc.navigation
    ];

    return Promise.all(originalPath.map(async (original) => {
        const reduced = getPostfixFile(original);

        await fs.promises.unlink(original);

        return fs.promises.rename(reduced, original);
    }));
}

/**
 * @param {Types.SrcConfing} paths
 * @returns {() => void}
 */
const getCleaner = (paths) => {
    const masterFolder = path.dirname(paths.master);
    const navigationFolder = path.dirname(paths.navigation);
    const inventoryFolder = path.dirname(paths.inventory);

    const filesPath = Object.values(paths);

    const filterForPostfixFiles = (/** @type {string} */ file) => !isOutPostfixFile(file);

    return () => {
        log(`Cleanup folders ${masterFolder} and ${navigationFolder}`);
        removeFilesExcept(masterFolder, filesPath, filterForPostfixFiles);
        removeFilesExcept(navigationFolder, filesPath, filterForPostfixFiles);
        removeFilesExcept(inventoryFolder, filesPath, filterForPostfixFiles);
    };
};

module.exports = {
    getCleaner,
    renameReducedToOriginal
};
