import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const libDirectory = path.join(__dirname, '../..');

/**
 * @param {string} fileWithinLib
 */
export const getAbsolutePathToLibFile = (fileWithinLib) => path.join(libDirectory, fileWithinLib);

/**
 * @param {string} path - path
 * @param {string} [startFolder] - start folder
 * @param {'exit' | 'returnNull'} [onMissingFile] - behavior in case of missing file
 * @returns {object} - imported data
 */
export const importJson = (jsonPath, startFolder = libDirectory, onMissingFile = 'exit') => {
    const filePath = path.join(startFolder, jsonPath);

    if (!fs.existsSync(filePath)) {
        if (onMissingFile === 'returnNull') {
            return null;
        }

        console.log(`File ${filePath} do not exist and cannot be imported`);
        process.exit(0);
    }

    const string = fs.readFileSync(filePath).toString();

    return JSON.parse(string);
};
