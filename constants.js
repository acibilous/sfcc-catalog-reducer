const path = require('path');
const config = require(path.join(process.cwd(), 'package.json'));

const catalogReducer = config.catalogReducer || require('./default.json');

module.exports.catalogReducer = catalogReducer;
module.exports.enabledCache = catalogReducer.enabledCache;
