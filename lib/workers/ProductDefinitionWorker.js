import XMLMatcher from '#xml/XMLMatcher.js';
import XMLProductDefinition from '#xml/XMLProductDefinition.js';
import ProductsConainter from '#model/ProductsConainter.js';

export default class ProductDefinitionWorker {
    /**
     * @param {Array<string>} productCatalogs 
     */
    constructor(productCatalogs) {
        this.productCatalogs = productCatalogs;
    }

    /**
     * @param {Array<string>} productIDsList 
     * @param {import('#types').CategoryConfig} containterConfig
     * @param {object} productConfig
     * @param {boolean} productConfig.isStandardProductsShouldBeProcessed
     * @param {boolean} productConfig.onlineFlagCheck
     * @returns {Promise<[Array<string>, Array<string>]>}
     */
    async filterProducts(productIDsList, containterConfig, { isStandardProductsShouldBeProcessed, onlineFlagCheck }) {
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

        const savedProducts = new ProductsConainter(containterConfig);

        for (const file of this.productCatalogs) {
            const matcher = new XMLMatcher(file).setName('Product definition parser');

            await matcher.startAsync('product', ({ attributes }, raw) => {
                /**
                 * We could terminate parsing only if standard product shouldn't be processed,
                 * otherwise we should keep parsing all products to ensure
                 * that our possibleStandardProducts have no dependency relations to other products.  
                 */
                if (savedProducts.isFull() && !isStandardProductsShouldBeProcessed) {
                    matcher.terminate();
                }

                const product = new XMLProductDefinition(raw, attributes);

                const onlineCheckResult = onlineFlagCheck
                    ? product.onlineFlag === 'true'
                    : true;

                const isWhitelistProduct = productIDsList.includes(product.ID);

                if (product.type === 'standard' && isWhitelistProduct) {
                    if (
                        isStandardProductsShouldBeProcessed
                        && onlineCheckResult
                        && !allProductsDependencies.has(product.ID)
                    ) {
                        possiblyStandardProducts.add(product.ID)
                    }
                    return;
                }

                const isContainerFullForCurrentType = savedProducts[product.type].length >= containterConfig[product.type];

                const isProductCouldBeSaved = !isContainerFullForCurrentType && isWhitelistProduct && onlineCheckResult;

                if (isStandardProductsShouldBeProcessed) {
                    product.dependencies.forEach(dependency => allProductsDependencies.add(dependency));

                    /**
                     * Now we know that this product is variation of some other product.
                     */
                    product.dependencies.forEach(dependency => possiblyStandardProducts.delete(dependency));
                }
                
                if (isProductCouldBeSaved) {
                    product.dependencies.forEach(dependency => savedProductsDependencies.add(dependency));

                    savedProducts[type].push(product.ID);
                }
            });

            if (savedProducts.isFull()) {
                break;
            }
        }

        /**
         * At the end of parsing we're sure that possiblyStandardProducts has only products without dependencies to any master product.
         * @type {Array<string>}
         */
        const availableStandardProducts = [...possiblyStandardProducts];

        savedProducts.standard = availableStandardProducts.slice(0, containterConfig.standard);

        const unusedStandardProducts = availableStandardProducts.slice(containterConfig.standard);

        const savedProductIDs = Object.values(savedProducts).flat();

        return [[
            ...savedProductIDs,
            ...savedProductsDependencies
        ], unusedStandardProducts];
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
