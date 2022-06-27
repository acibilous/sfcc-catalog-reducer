export default class DependancyMap {
    constructor() {
        /**
         * @type {{ [dependancyID: string]: Set<import('#types').XMLProductDefinition> }}
         */
        this.map = {};

        /**
         * @type {{ [productID: string]: Set<string>}}
         */
        this.independentProducts = {};
    }

    /**
     * @param {string} dependancyID 
     */
    getParents(dependancyID) {
        return this.map[dependancyID];
    }

    /**
     * @param {string} productID 
     */
    isDependancy(productID) {
        return productID in this.map;
    }

    /**
     * @param {string} dependentProductID 
     * @param  {Array<import('#xml/XMLProductDefinition')>} parentProducts 
     */
    add(dependentProductID, ...parentProducts) {
        /**
         * Now we know that this product is variation of some other product.
         */
        delete this.independentProducts[dependentProductID];

        if (!this.map[dependentProductID]) {
            this.map[dependentProductID] = new Set();
        }

        parentProducts.forEach(parent => {
            this.map[dependentProductID].add(parent);
        });

        return this;
    }

    /**
     * @param {import('#types').XMLProductDefinition} parrentWithDependencies
     */
    addByParent(parrentWithDependencies) {
        parrentWithDependencies.dependencies.forEach(dependency => this.add(dependency, parrentWithDependencies));
    }

    /**
     * @param {string} productID 
     * @param  {Array<string>} categoryIDs 
     */
    addIndependentProduct(productID, ...categoryIDs) {
        if (productID in this.map) {
            console.log(`Cannot add ${productID} as independent product because it has dependancy to ${[...this.map[productID]].map(d => d.ID)}`);
            return;
        }

        if (!this.independentProducts[productID]) {
            this.independentProducts[productID] = new Set();
        }

        categoryIDs.forEach(category => {
            this.independentProducts[productID].add(category);
        });
    }
}
