const Types = require('../types');

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
 * @param {Types.SrcConfing} paths
 * @returns {() => void}
 */
const getCleaner = (paths) => {
    const masterFolder = path.dirname(paths.master);
    const navigationFolder = path.dirname(paths.navigation);
    const inventoryFolder = path.dirname(paths.inventory);

    const filesPath = Object.values(paths);

    return () => {
        log(`Cleanup folders ${masterFolder} and ${navigationFolder}`);
        removeFilesExcept(masterFolder, filesPath);
        removeFilesExcept(navigationFolder, filesPath);
        removeFilesExcept(inventoryFolder, filesPath);
    };
};

module.exports = {
    removeFilesExcept,
    getCleaner
};
