const Types = require('./lib/types');

const path = require('path');
const config = require(path.join(process.cwd(), 'package.json'));
const defaults = require('./default.json');
const { setDefaultMinFiles } = require('./lib/tools/utils');

/**
 * @type {Types.CatalogReducerConfig}
 */
const catalogReducer = config.catalogReducer || defaults;
const src = catalogReducer.src;

const defaultMinEnding = catalogReducer.outPostfix + '.xml';

setDefaultMinFiles(src, defaultMinEnding);

module.exports.catalogReducer = catalogReducer;
module.exports.enabledCache = catalogReducer.enabledCache;
