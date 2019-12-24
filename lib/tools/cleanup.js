const
    fs = require('fs'),
    path = require('path');

/**
 * 
 * @param {string} dir - destination to the folder 
 * @param {Array.<string>} exclusions - files that should be excluded during removal
 */
const removeFilesExcept = (dir, exclusions) => {
    let files = fs.readdirSync(dir);

    exclusions = exclusions.map(file => path.basename(file));

    files.forEach(file => {
        exclusions.includes(file) || file === 'static' ? '' : fs.unlinkSync(path.join(dir, file))
    });
}

module.exports = {
    removeFilesExcept
}