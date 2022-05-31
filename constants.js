import { importJson, getAbsolutePathToLibFile } from './lib/tools/import.js';

/**
 * @type {{ catalogReducer: Partial<import('#types').CatalogReducerConfig> }}
 */
const packageJson = importJson('package.json', process.cwd());
const defaults = importJson('./configs/default.json');
const testConfig = importJson('./configs/test.json');

export const isTestEnv = process.argv.includes('--test-config');

if (!isTestEnv) {
    if (!packageJson.catalogReducer) {
        console.log('Please, provide catalog reducer config in package.json in the "catalogReducer" field');

        process.exit(0);
    }

    if (packageJson.catalogReducer.src.master) {
        console.log('Property "master" is deprecated, use "masters" and pass an array of path patterns');

        process.exit(0);
    }

    if (packageJson.catalogReducer.src.navigation) {
        console.log('Property "navigation" is deprecated, use "navigations" and pass an array of path patterns');

        process.exit(0);
    }

    if (packageJson.catalogReducer.src.minifiedMaster) {
        console.log('Property "minifiedMaster" is deprecated, the path of out file calculated automatically using "behavior" and "outPostfix" properties');

        process.exit(0);
    }

    if (!packageJson.catalogReducer.src?.masters || !packageJson.catalogReducer.src?.navigations) {
        console.log('Please, provide master and navigation catalogs in catalog reducer config');

        process.exit(0);
    }

    if (!packageJson.catalogReducer.src?.finalCacheDir) {
        console.log('Please, provide directory for final cache (src.finalCacheDir)');

        process.exit(0);
    }

    if (packageJson.catalogReducer.behavior
        && packageJson.catalogReducer.behavior !== 'createNew'
        && packageJson.catalogReducer.behavior !== 'updateExisting'
    ) {
        console.log('Unknown "behavior" value in catalog reducer config');

        process.exit(0);
    }
}

const productionConfig = {
    ...defaults,
    ...packageJson.catalogReducer
};

/**
 * @type {import('#types').CatalogReducerConfig}
 */
export const config = isTestEnv ? testConfig : productionConfig;

if (isTestEnv) {
    config.src.finalCacheDir = getAbsolutePathToLibFile(config.src.finalCacheDir);
}

export const enabledCache = config.enabledCache;
