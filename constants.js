import { importJson } from '#tools/import.js';

/**
 * @type {{ catalogReducer: Partial<import('#types').CatalogReducerConfig> }}
 */
const packageJson = importJson('package.json', process.cwd());
const catalogReducerFile = importJson('catalogReducerConfing.json', process.cwd(), 'returnNull');
const defaults = importJson('./configs/default.json');
const testConfig = importJson('./configs/test.json');

/**
 * @type {Array<import('#types').ProductType>}
 */
const productTypes = ['master', 'masterWithVariationGroups', 'set', 'bundle', 'standard'];

/**
 * @type {Partial<import('#types').CatalogReducerConfig>}
 */
const catalogReducerConfig = catalogReducerFile || packageJson.catalogReducer;

export const isTestEnv = process.argv.includes('--test-config');

if (!isTestEnv) {
    if (!catalogReducerConfig) {
        console.log('Please, provide catalog reducer config in catalogReducerConfing.json in the root of the project');

        process.exit(0);
    }

    if (catalogReducerConfig.src.master) {
        console.log('Property "master" is deprecated, use "masters" and pass an array of path patterns');

        process.exit(0);
    }

    if (catalogReducerConfig.src.navigation) {
        console.log('Property "navigation" is deprecated, use "navigations" and pass an array of path patterns');

        process.exit(0);
    }

    if (catalogReducerConfig.src.minifiedMaster) {
        console.log('Property "minifiedMaster" is deprecated, the path of out file calculated automatically using "behavior" and "outPostfix" properties');

        process.exit(0);
    }

    if (!catalogReducerConfig.src?.masters || !catalogReducerConfig.src?.navigations) {
        console.log('Please, provide master and navigation catalogs in catalog reducer config');

        process.exit(0);
    }

    if (catalogReducerConfig.behavior
        && catalogReducerConfig.behavior !== 'createNew'
        && catalogReducerConfig.behavior !== 'updateExisting'
    ) {
        console.log('Unknown "behavior" value in catalog reducer config');

        process.exit(0);
    }
}

const productionConfig = {
    ...defaults,
    ...catalogReducerConfig
};

/**
 * @type {import('#types').CatalogReducerConfig}
 */
export const config = isTestEnv ? testConfig : productionConfig;

export const { productsConfig } = config;

/**
 * @type {import('#types').GeneralCategoryConfigs}
 */
export const generalCategoryConfigs = {};

/**
 * @type {import('#types').SpecificCategoryConfigs}
 */
export const specificCategoryConfigs = {};

Object.entries(config.categoriesConfig).forEach(([category, config]) => {
    productTypes.forEach(type => {
        config[type] = config[type] || 0;
    });

    if (category[0] === '$') {
        generalCategoryConfigs[category] = config;
    } else {
        specificCategoryConfigs[category] = config;
    }
});

export const src = config.src;

export const enabledCache = config.enabledCache;
