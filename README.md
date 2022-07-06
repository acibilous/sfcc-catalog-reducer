# Catalog Reducer for SFCC (Demandware)

>At all module based on modifyied [SaxJS](https://www.npmjs.com/package/sax) library. It's using nodejs streams to work with huge xml files.

## Idea

Usually production catalog is huge and SFCC sandboxes cannot handle a big amount of catalog data without performance degradation. On the other hand, a sandbox is an instance for developing a site and it does not require an entire catalog to be present on it. 
Will be enough to have few properly configured categories and all types of products. All other categories in the navigation catalog can have assigned some dummy products, just for the proper rendering navigation menu. Based on such assumption was created this tool, that allows specifying a few categories that will be kept untouched (see "keepAsIs" config) or preserve in it specific products (by specifying IDs) that are for sure properly configured, or just set amount of product per each product type (master, standard, set, bundle) to be preserved in each category.

## How it works?

Reducing of catalogs works based on the next logic:
1. Gathers all file paths processing passed file patterns in `src` field
2. Reads navigation catalogs for retrieving list of all categories and product assignments for specific categories (set in custom category configs, if such present), sorts assignments by specific categories. Gathers `keepAsIs` products (if needed)
3. Reads master catalogs and parses product definitions.
    1. Creates containers for product IDs that should be saved - either as categorized, or as $default
    2. Reads all product definitions one-by-one
    3. Parses product based on a type:
        - non-`standard`: 
            1. Saves all product dependencies, so we could know it's not independent products
            2. if the container (categorized or $default) is not full for the following type, and the product fits product requirements (f.e. online-flag check) **OR** if this product is predefined in the config and fits product requirements - the product is added to the container.
        - `standard`: 
            1. If the product is independed it will be added to the list of independent products
            2. If the product is a dependency and the master for this product wasn't processed - it will be processed
    4. Having list of independent products, we process them according to the configuration - adding to categorized or $default container
4. After parsing master catalogs, we have a list of all product that should be saved. This list is joined with list of `keepAsIs` products (if such present)
5. Filters navigation, master, inventory and pricebook catalogs and left only products that were gathered on the step 4
6. Generates missing price or allocation records (if needed)

Note: if you are passing multiple master catalogs, the script will filter products in them like it's one big catalog.
For exemple, if there are two passed master catalogs: first has 5 master products, second - 4 master products
and you want to keep only 7 master product and set it in the config as $default.master=7,
after reducing, the first catalog still will have 5 products, and the second one only 2, making it 7 in sum.

## $default category

$default category points how much products left in all unspecified categories, with generation of corresponding records.
After reducing, all $default category products will be assigned to all unspecific categories.
It will be the same products for every unspecified category.

## See how it works

Execute `npm run test-reduce` and see the result of processing of test data in sfcc-catalog-reducer/test-data folder.
You can modify test config in `configs/test.json` file.

## Configuration

Add file `catalogReducerConfig.json` to the root of your project with configuration:

```json
{
    "src": {
        "masters": ["./testdata/master/*.xml"], // master catalog files
        "navigations": ["./testdata/navigation/*.xml"], // navigation catalog
        "inventories": ["./testdata/inventory/*.xml"], // inventory-list catalogs (OPTIONAL)
        "priceBooks": ["./testdata/priceBook/*.xml"] // pricebook catalogs (OPTIONAL)
    },
    "behavior": "createNew", // script behavior could be either 'createNew' or 'updateExisting' (OPTIONAL, createNew by default)
    "outPostfix": "_reduced", // ending part of out files, works with behavior=createNew (OPTIONAL, _reduced by default)
    "categoriesConfig": { // Sets amount of products (with their dependencies) should to keep after reducing for every type
        "$default": {
            "master": 1,
            "masterWithVariationGroups": 1,
            "set": [ // You can set either the number of product to save, or an array of predefined products.
                "product-set-1",
                "product-set-2",
                "product-set-3"
            ],
            "bundle": 1,
            "standard": 0 // only standalone products, meaning not including dependencies from master, set or bundle
        },
        "CATEGORY_ID_CUSTOM_CONFIGURATION": { // Config for certain category (OPTIONAL)
            "master": 5,
            "masterWithVariationGroups": 0, // OPTIONAL. If you want to set 0 for some type, you could just remove the field
            "set": 5,
            "bundle": 5,
            "standard": 10
        },
        "CATEGORY_ID_KEEP_CONFIGURATION": "keepAsIs" // OPTIONAL. Keep all data for every product assigned to this category
    },
    "productsConfig": { // OPTIONAL
        "onlineFlagCheck": true // To perform online-flag=true check (OPTIONAL, true by default)
    },
    "generateMissingRecords": { // OPTIONAL. Require inventory and pricebook catalogs with at least one record
        "inventoryAllocation": 1000,
        "price": 9.99
    }
}
```
