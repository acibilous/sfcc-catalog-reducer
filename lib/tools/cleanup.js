import Types from '../types.js';
import fs from 'fs';
import path from 'path';
import { log } from './logger.js';
import { isOutPostfixFile, getPostfixFile, getFilesByPatterns } from './files.js';

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
export const renameReducedToOriginal = async (originalSrc) => {
    const [priceBooks, inventories] = await Promise.all([
        getFilesByPatterns(originalSrc.pricebooks),
        getFilesByPatterns(originalSrc.inventories)
    ]);

    const originalPaths = [
        ...priceBooks,
        ...inventories,
        originalSrc.master,
        originalSrc.navigation
    ];

    return Promise.all(originalPaths.map(async (original) => {
        const reduced = getPostfixFile(original);

        await fs.promises.unlink(original);

        return fs.promises.rename(reduced, original);
    }));
}

/**
 * @param {Types.SrcConfing} paths
 * @returns {Promise<() => void>}
 */
export const getCleaner = async (paths) => {
    const [priceBooks, inventories] = await Promise.all([
        getFilesByPatterns(paths.pricebooks),
        getFilesByPatterns(paths.inventories)
    ]);

    const originalPaths = [
        ...priceBooks,
        ...inventories,
        paths.master,
        paths.navigation
    ];

    const filterForPostfixFiles = (/** @type {string} */ file) => !isOutPostfixFile(file);

    const masterFolder = path.dirname(paths.master);
    const navigatoinFolder = path.dirname(paths.navigation);
    const inventoryFolder = path.dirname(inventories[0]); // TODO it could be mutile dirs, not just one

    return () => {
        log(`Cleanup folders ${masterFolder} and ${inventoryFolder}`);
        removeFilesExcept(masterFolder, originalPaths, filterForPostfixFiles);
        removeFilesExcept(inventoryFolder, originalPaths, filterForPostfixFiles);
        removeFilesExcept(navigatoinFolder, originalPaths, filterForPostfixFiles);
    };
};
