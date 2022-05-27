const Types = require('./lib/types');

const path = require('path');
const config = require(path.join(process.cwd(), 'package.json'));
/**
 * @type {Types.CatalogReducerConfig}
 */
const defaults = require('./default.json');

/**
 * @type {Types.CatalogReducerConfig}
 */
const catalogReducer = config.catalogReducer || defaults;

catalogReducer.behaviour = catalogReducer.behaviour || defaults.behaviour;
catalogReducer.outPostfix = catalogReducer.outPostfix|| defaults.outPostfix;

module.exports.catalogReducer = catalogReducer;
module.exports.enabledCache = catalogReducer.enabledCache;
