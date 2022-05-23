const fs = require('fs');
const path = require('path');

const { log } = require('./logger');
/**
 * @param {string} dir - destination to the folder
 * @param {Array<string>} exclusions - files that should be excluded during removal
 */
const removeFilesExcept = (dir, exclusions) => {
    const files = fs.readdirSync(dir);

    exclusions = exclusions.map(file => path.basename(file));

    files.forEach(file => {
        exclusions.includes(file) || file === 'static' ? '' : fs.unlinkSync(path.join(dir, file));
    });
};

/**
 * @typedef CleanerData
 * @property {string} masterPath,
 * @property {string} navigationPath,
 * @property {string} minifiedMasterPath
 */

/**
 * @param {CleanerData} cleanerData
 * @returns {() => void}
 */
const getCleaner = ({
    masterPath,
    navigationPath,
    minifiedMasterPath
}) => {
    const masterFolder = path.dirname(masterPath);
    const navigationFolder = path.dirname(navigationPath);

    return () => {
        log(`Cleanup folders ${masterFolder} and ${navigationFolder}`);
        removeFilesExcept(masterFolder, [masterPath, navigationPath, minifiedMasterPath]);
        removeFilesExcept(navigationFolder, [masterPath, navigationPath, minifiedMasterPath]);
    };
};

module.exports = {
    removeFilesExcept,
    getCleaner
};
