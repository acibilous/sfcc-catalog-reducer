import Types from './lib/types.js';

import { importJson } from './lib/tools/import.js';

const config = importJson('package.json', process.cwd());
const defaults = importJson('./default.json');

/**
 * @type {Types.CatalogReducerConfig}
 */
export const catalogReducer = config.catalogReducer || defaults;

catalogReducer.behaviour = catalogReducer.behaviour || defaults.behaviour;
catalogReducer.outPostfix = catalogReducer.outPostfix|| defaults.outPostfix;

export const enabledCache = catalogReducer.enabledCache;
