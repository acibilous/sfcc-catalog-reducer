import Registry from './Registry.js';

/**
 * @typedef Cache
 * @property {Record<string, string>} categories - child-parent pair
 */

/**
 * @extends {Registry<Cache>}
 */
export default class NavigationAssignmentsRegistry extends Registry {
    /**
     * @param {string} dataFolder
     */
     constructor (dataFolder) {
        super(dataFolder, ['categories']);
    }

    /**
     * @override
     */
    get cachePrefix () {
        return 'navigation_categories_';
    }

    /**
     * @param {string} categoryId
     * @param {string | null} productId
     */
    addCategory (categoryId, parrentId) {
        this.cache.categories[categoryId] = parrentId;
    }

    /**
     * @param {Array<string>} requiredCategories
     */
    filterCategories (requiredCategories) {
        const finalCategories = [...requiredCategories];

        requiredCategories.forEach(category => this.pushParentCategories(category, finalCategories));

        Object.keys(this.cache.categories).forEach(key => {
            if (!finalCategories.includes(key)) {
                delete this.cache.categories[key];
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
        const parent = this.cache.categories[category];

        if (parent && !array.includes(parent)) {
            array.push(parent);

            this.pushParentCategories(parent, array);
        }
    }
};
