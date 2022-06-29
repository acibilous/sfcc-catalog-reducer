/**
 * DependencyParent class created for storing in memory only necessary date that will be used later.
 * 
 * If we use XMLProductDeclaration class instead, we would store large piece of data in 'raw' field,
 * that contains full XML declaration string. 
 */
export class DependencyParent {
    /**
     * @param {import('#types').XMLProductDefinition} product 
     */
    constructor(product) {
        this.ID = product.ID;
        this.dependencies = product.dependencies;
        this.variationGroups = product.variationGroups;
        this.isSkipListProduct = product.isSkipListProduct;
        this.type = product.type;
    }
}

export default class DependencyMap {
    constructor() {
        /**
         * @type {{ [dependencyID: string]: Set<DependencyParent> }}
         */
        this.map = {};

        /**
         * @type {{ [productID: string]: Set<string>}}
         */
        this.independentProducts = {};
    }

    /**
     * @param {string} dependencyID 
     */
    getParents(dependencyID) {
        return this.map[dependencyID];
    }

    /**
     * @param {string} productID 
     */
    isDependency(productID) {
        return productID in this.map;
    }

    /**
     * @param {string} dependentProductID 
     * @param  {DependencyParent} parent
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
     * @param {import('#types').XMLProductDefinition | DependencyParent} parentWithDependencies
     */
    addByParent(parentWithDependencies) {
        const parent = parentWithDependencies instanceof DependencyParent
            ? parentWithDependencies
            : new DependencyParent(parentWithDependencies);

        parent.dependencies.forEach(dependency => this.add(dependency, parent));
    }

    /**
     * @param {string} productID 
     * @param  {Array<string>} categoryIDs 
     */
    addIndependentProduct(productID, ...categoryIDs) {
        if (productID in this.map) {
            console.log(`Cannot add ${productID} as independent product because it has dependency to ${[...this.map[productID]].map(d => d.ID)}`);
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
