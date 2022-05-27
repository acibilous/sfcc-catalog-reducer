import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libDirectory = path.join(__dirname, '../..');

/**
 * @param {string} path - path
 * @param {string} startFolder - start folder
 * @returns {object} - imported data
 */
export const importJson = (jsonPath, startFolder = libDirectory) => {
    const filePath = path.join(startFolder, jsonPath);

    if (!fs.existsSync(filePath)) {
        console.log(`File ${filePath} do not exist and cannot be imported`);
        process.exit(0);
    }

    const string = fs.readFileSync(filePath).toString();

    return JSON.parse(string);
};
