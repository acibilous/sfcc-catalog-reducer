import { importJson } from './lib/tools/import.js';

const config = importJson('package.json', process.cwd());
const defaults = importJson('./default.json');

/**
 * @type {import('#types').CatalogReducerConfig}
 */
export const catalogReducer = config.catalogReducer || defaults;

catalogReducer.behavior = catalogReducer.behavior || defaults.behavior;
catalogReducer.outPostfix = catalogReducer.outPostfix|| defaults.outPostfix;

export const enabledCache = catalogReducer.enabledCache;
