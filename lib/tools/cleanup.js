const fs = require('fs');
const path = require('path');

const { log } = require('./logger');
/**
 * @param {string} dir - destination to the folder
 * @param {Array.<string>} exclusions - files that should be excluded during removal
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
 * @property {string} masterCatalogFile,
 * @property {string} navigationCatalogFile,
 * @property {string} minifiedMaster
 */

/**
 * @param {CleanerData} cleanerData
 * @returns {() => void}
 */
const getCleaner = ({
    masterCatalogFile,
    navigationCatalogFile,
    minifiedMaster
}) => {
    const masterFolder = path.dirname(masterCatalogFile);
    const navigationFolder = path.dirname(navigationCatalogFile);

    return () => {
        log(`Cleanup folders ${masterFolder} and ${navigationFolder}`);
        removeFilesExcept(masterFolder, [masterCatalogFile, navigationCatalogFile, minifiedMaster]);
        removeFilesExcept(navigationFolder, [masterCatalogFile, navigationCatalogFile, minifiedMaster]);
    };
};

module.exports = {
    removeFilesExcept,
    getCleaner
};
