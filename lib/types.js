/**
 * @typedef {import('./catalog/registry/ProductsRegistry')} ProductsRegistry
 *
 * @typedef {'master' | 'set' | 'bundle' | 'standard'} ProductType
 * @typedef {'openmatchedtag' | 'closematchedtag'} XMLParserEventName
 * @typedef {XMLParserEventName | 'end' | 'match'} XMLMatcherEventName
 *
 * @typedef {(tag: XMLTag, cache: string) => void} MatchFilter
 *
 * @typedef XMLTag
 * @property {string} name
 * @property {Record<string, string>} attributes
 *
 * @typedef Product
 * @property {string} type
 * @property {Array<string>} dependencies
 *
 * @typedef Category
 * @property {Record<string, Product>} products
 *
 * @typedef CategoryOptimizationConfig
 * @property {number} set
 * @property {number} bundle
 * @property {number} master
 *
 * @typedef ProductsConfig
 * @property {Array<string>} inclusions
 * @property {boolean} includeIfDependency
 * @property {boolean} includeChildren
 *
 * @typedef CategoryConfing
 * @property {number} master
 * @property {number} set
 * @property {number} bundle
 * @property {number} standard
 *
 * @typedef {{ default: CategoryConfing, [category: string]: CategoryConfing }} CategoriesConfig
 *
 * @typedef SrcConfing
 * @property {string} master
 * @property {string} minifiedMaster
 * @property {string} navigation
 * @property {string} minifiedNavigation
 *
 * @typedef CatalogReducerConfig
 * @property {SrcConfing} src
 * @property {boolean} enabledCache
 * @property {boolean} cleanupData
 * @property {CategoriesConfig} categoriesConfig
 * @property {ProductsConfig} [productsConfig]
 */

module.exports = {};
