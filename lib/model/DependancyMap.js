class DependancyParent {
    /**
     * @param {import('#types').XMLProductDefinition} product 
     */
    constructor(product) {
        this.ID = product.ID;
        this.dependencies = product.dependencies;
        this.isSkipListProduct = product.isSkipListProduct;
        this.type = product.type;
    }
}

export default class DependancyMap {
    constructor() {
        /**
         * @type {{ [dependancyID: string]: Set<DependancyParent> }}
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
     * @param  {DependancyParent} parent
     */
    add(dependentProductID, parent) {
        /**
         * Now we know that this product is variation of some other product.
         */
        delete this.independentProducts[dependentProductID];

        if (!this.map[dependentProductID]) {
            this.map[dependentProductID] = new Set();
        }

        this.map[dependentProductID].add(parent);

        return this;
    }

    /**
     * @param {import('#types').XMLProductDefinition} parrentWithDependencies
     */
    addByParent(parrentWithDependencies) {
        const parent = new DependancyParent(parrentWithDependencies);

        parent.dependencies.forEach(dependency => this.add(dependency, parent));
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
