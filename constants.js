const Types = require('./lib/types');

const path = require('path');
const config = require(path.join(process.cwd(), 'package.json'));
const defaults = require('./default.json');

/**
 * @type {Types.CatalogReducerConfig}
 */
const catalogReducer = config.catalogReducer || defaults;

module.exports.catalogReducer = catalogReducer;
module.exports.enabledCache = catalogReducer.enabledCache;
