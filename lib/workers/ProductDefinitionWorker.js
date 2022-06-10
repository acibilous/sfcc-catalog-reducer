import XMLMatcher from '#xml/XMLMatcher.js';

const DEPENDENCY_REGEX = /product-id="(.+?)"/g;

/**
 * @param {RegExp} regex
 * @param {string} str
 * @param {Array<RegExpExecArray>} matches
 * @returns {Array<RegExpExecArray>}
 */
function findMatches(regex, str, matches = []) {
    const res = regex.exec(str);

    res && matches.push(res) && findMatches(regex, str, matches);

    return matches;
}

export default class ProductDefinitionWorker {
    /**
     * @param {Array<string>} productCatalogs 
     */
    constructor(productCatalogs) {
        this.productCatalogs = productCatalogs;
    }

    /**
     * @param {Array<string>} productIDsList 
     * @param {import('#types').CategoryConfig} config 
     */
    async filterProducts(productIDsList, config) {
        const isStandardProductsShouldBeProcessed = config.standard > 0;

        /**
         * @type {Set<string>}
         */
        const allProductsDependencies = new Set();

        /**
         * @type {Set<string>}
         */
        const savedProductsDependencies = new Set();

        /**
         * If we haven't parsed master product yet, we can't tell if a product is variation or standalone product.
         * @type {Set<string>}
         */
        const possiblyStandardProducts = new Set();

        /**
         * @type {import('#types').CategoryProductsContainer}
         */
        const savedProducts = {
            master: [],
            masterWithVariationGroups: [],
            set: [],
            bundle: [],
            standard: []
        };

        for (const file of this.productCatalogs) {
            const matcher = new XMLMatcher(file).setName('Product definition parser');

            await matcher.startAsync('product', ({ attributes }, raw) => {
                if (this.isContainerFull(savedProducts, config)) {
                    matcher.terminate();
                }

                if (!productIDsList.includes(attributes['product-id'])) {
                    return;
                }

                const type = this.getProductTypeByRaw(raw);
                
                if (type === 'standard') {
                    const isCurrentStandardProductCouldBeSaved = isStandardProductsShouldBeProcessed && savedProducts.standard.length < config.standard;
                    
                    if (isCurrentStandardProductCouldBeSaved && !allProductsDependencies.has(attributes['product-id'])) {
                        possiblyStandardProducts.add(attributes['product-id']);
                    }
                    return;
                }

                const isProductCouldBeSaved = savedProducts[type].length < config[type];

                const productDependencies = this.getDependenciesFromRaw(raw);

                if (isStandardProductsShouldBeProcessed) {
                    productDependencies.forEach(dependency => allProductsDependencies.add(dependency));

                    /**
                     * Now we know that this product is variation of some other product.
                     */
                    productDependencies.forEach(dependency => possiblyStandardProducts.delete(dependency));
                }
                
                if (isProductCouldBeSaved) {
                    productDependencies.forEach(dependency => savedProductsDependencies.add(dependency));

                    savedProducts[type].push(attributes['product-id']);
                }
            });

            if (this.isContainerFull(savedProducts, config)) {
                break;
            }
        }

        /**
         * At the end of parsing we're sure that possiblyStandardProducts has only products without dependencies to any master product.
         */
        const availableStandardProducts = [...possiblyStandardProducts];

        savedProducts.standard = availableStandardProducts.slice(0, config.standard);

        const savedProductIDs = Object.values(savedProducts).flat();

        return [
            ...savedProductIDs,
            ...savedProductsDependencies
        ];
    }

    /**
     * @private
     * @param {import('#types').CategoryProductsContainer} container 
     * @param {import('#types').CategoryConfig} config 
     */
    isContainerFull(container, config) {
        return Object.keys(container).every(key => {
            return container[key].length >= config[key];
        });
    }

    /**
     * @private
     * @param {string} raw
     */
    getDependenciesFromRaw(raw) {
        const dependencies = findMatches(DEPENDENCY_REGEX, raw).map(el => el[1]);

        dependencies.shift();

        return dependencies;
    }

    /**
     * @private
     * @param {string} raw
     * @returns {import('#types').ProductType}
     */
    getProductTypeByRaw(raw) {
        let type = 'standard';

        if (raw.includes('bundled-products>')) {
            type = 'bundle';
        } else if (raw.includes('product-set-products>')) {
            type = 'set';
        } else if (raw.includes('variation-groups>')) {
            type = 'masterWithVariationGroups';
        } else if (raw.includes('variations>')) {
            type = 'master';
        }

        return type;
    }
}

// const dealsProductIDs = [
//     'product-1',
//     'product-2',
//     'product-3',
//     'product-4',
//     'product-5',
//     'product-bundle-1',
//     'product-bundle-2',
//     'product-bundle-3',
//     'product-bundle-4',
//     'product-bundle-5',
//     'product-variation-master-1',
//     'product-variation-master-2',
//     'product-variation-master-3',
//     'product-set-1',
//     'product-set-2',
//     'product-set-3',
//     'product-set-4',
//     'product-set-5',
//     'product-variation-1',
//     'product-variation-2',
//     'product-variation-3',
//     'product-variation-4',
//     'product-variation-5',
//     'product-variation-6',
//     'product-variation-7',
//     'product-vg-white',
//     'product-vg-green',
//     'product-vg-brown',
//     'product-vg-orange',
//     'master-product-vg',
//     'x-product-1',
//     'x-product-2',
//     'x-product-3',
//     'x-product-4',
//     'x-product-5',
//     'x-product-bundle-1',
//     'x-product-bundle-2',
//     'x-product-bundle-3',
//     'x-product-bundle-4',
//     'x-product-bundle-5',
//     'x-product-variation-master-1',
//     'x-product-variation-master-2',
//     'x-product-variation-master-3',
//     'x-product-set-1',
//     'x-product-set-2',
//     'x-product-set-3',
//     'x-product-set-4',
//     'x-product-set-5',
//     'x-product-variation-1',
//     'x-product-variation-2',
//     'x-product-variation-3',
//     'x-product-variation-4',
//     'x-product-variation-5',
//     'x-product-variation-6',
//     'x-product-variation-7'
//   ]

// new ProductDefinitionWorker([
//     'testdata/master/master1.xml',
//     'testdata/master/master2.xml'
// ]).filterProducts(dealsProductIDs, {
//     bundle: 0,
//     master: 0,
//     masterWithVariationGroups: 1,
//     set: 0,
//     standard: 0
// }).then(console.log);
