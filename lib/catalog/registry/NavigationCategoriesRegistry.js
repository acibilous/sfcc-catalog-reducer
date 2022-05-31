import Registry from './Registry.js';

/**
 * @typedef Cache
 * @property {Record<string, string>} categoriesParents - child-parent pair
 */

/**
 * @extends {Registry<Cache>}
 */
export default class NavigationCategoriesRegistry extends Registry {
    /**
     * @param {string} dataFolder
     * @param {string} name
     */
     constructor (dataFolder, name) {
        super(dataFolder, ['categoriesParents']);
        this.name = name;
    }

    /**
     * @override
     */
    get cachePrefix () {
        return this.name + '_categories_';
    }

    /**
     * @param {string} categoryId
     * @param {string | null} productId
     */
    addCategory (categoryId, parrentId) {
        this.cache.categoriesParents[categoryId] = parrentId;
    }

    /**
     * @param {Array<string>} requiredCategories
     */
    filterCategories (requiredCategories) {
        const finalCategories = [...requiredCategories];

        requiredCategories.forEach(category => this.pushParentCategories(category, finalCategories));

        Object.keys(this.cache.categoriesParents).forEach(key => {
            if (!finalCategories.includes(key)) {
                delete this.cache.categoriesParents[key];
            }
        });

        this.writeCache();

        return finalCategories;
    }

    /**
     * @private
     * @param {string} category
     * @param {Array<string>} array
     */
    pushParentCategories(category, array) {
        const parent = this.cache.categoriesParents[category];

        if (parent && !array.includes(parent)) {
            array.push(parent);

            this.pushParentCategories(parent, array);
        }
    }

    /**
     * @param {Array<Cache['categoriesParents']>} categoryCacheArray
     */
    appendCategoriesParrents(categoryCacheArray) {
        categoryCacheArray.forEach(categories => {
            Object.assign(this.cache.categoriesParents, categories);
        });
    }
};
