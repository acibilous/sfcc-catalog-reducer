import fs from 'fs';
import path from 'path';
import { log } from './logger.js';
import { isOutPostfixFile, getPostfixFile } from './files.js';

/**
 * @param {string} dir - destination to the folder
 * @param {Array<string>} exclusions - files that should be excluded during removal
 * @param {(file: string) => boolean} filter - additional filter
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
 * @param {Array<string>} files
 */
export const renameReducedToOriginal = async (files) => {
    return Promise.all(files.map(async (original) => {
        const reduced = getPostfixFile(original);

        await fs.promises.unlink(original);

        return fs.promises.rename(reduced, original);
    }));
}

/**
 * @description Deletes all files except the ones that are specified in the `files` array and out files with corresponding postfix (reduced catalogs)
 * @param {Array<string>} files
 * @returns {() => void}
 */
export const getCleaner = (files) => {
    const dirs = [...new Set(files.map(path.dirname))];

    return () => {
        dirs.forEach(folder => {
            log(`Cleanup folder ${folder}`);

            removeFilesExcept(folder, files, (file) => !isOutPostfixFile(file));
        });
    };
};
