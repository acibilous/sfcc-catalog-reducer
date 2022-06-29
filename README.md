# Catalog Reducer for SFCC (Demandware)

>At all module based on modifyied [SaxJS](https://www.npmjs.com/package/sax) library. It's using nodejs streams to work with huge xml files.

## How it works?

Now it reducing master catalog based on the next logic
- Read master catalogs xml to map products with their dependencies (master-variation, etc.)
- Read navigation catalogs xml to collect category assignments and category definitions
- Merge those types of registries in navigation one to filter not assigned products and collect dependencies of assigned in navigation
- Read master and navigation catalogs again and simultaneously write their data to out reduced file based on registry from previous step and provided configuration in `package.json`
- Read pricebook and inventory catalogs (if they are passed in `package.json`) and write their reduced versions just like with master and navigation catalogs
- If behavior is `updateExisting`, deletes original xml files and rename reduced xml catalogs to original name effectively updating it

Note: if you are passing multiple master catalogs, the script will filter products in them like it's one big catalog.
For exemple, if there are two passed master catalogs: first has 5 master products, second - 4 master products
and you want to keep only 7 master product and set it in categoriesConfig.category.master=7,
after reducing the first catalog still will have 5 products, and the second one only 2, making it 7 in sum.

## See how it works

Execute `npm run test-reduce` and see the result of processing of test data in sfcc-catalog-reducer/test-data folder.
Execute `npm run test-cache-reset` to remove cached json data.

## Configuration

Add file `catalogReducerConfing.json` to the root of your project with configuration:

```json
{
    "src": {
        "finalCacheDir": "./testdata/cache", // empty folder that could keep cache while calculation
        "masters": ["./testdata/master/*.xml"], // master catalog files
        "navigations": ["./testdata/navigation/*.xml"], // navigation catalog
        "inventories": ["./testdata/inventory/*.xml"], // inventory-list catalogs (OPTIONAL)
        "priceBooks": ["./testdata/priceBook/*.xml"] // pricebook catalogs (OPTIONAL)
    },
    "behavior": "createNew", // script behavior could be either 'createNew' or 'updateExisting' (OPTIONAL, createNew by default)
    "outPostfix": "_reduced", // ending part of out files, works with behavior=createNew (OPTIONAL, _reduced by default)
    "enabledCache": true, // to read catalogs data from JSONs if exist
    "cleanupData": false, // to remove catalogs data JSONs after processing
    "categoriesConfig": { // Sets amount of products (with their dependencies) should to keep after reducing for every type
        "$default": {
            "master": 1,
            "masterWithVariationGroups": 1,
            "set": [ // You can set either number of product to save, or an array of certain products.
                "product-set-1",
                "product-set-2",
                "product-set-3"
            ],
            "bundle": 1,
            "standard": 0 // only standalone products, meaning not including dependencies from master, set or bundle
        },
        "CATEGORY_ID_CUSTOM_CONFIGURATION": { // Config for certain category (OPTIONAL)
            "master": 5,
            "masterWithVariationGroups": 0, // OPTIONAL, if you want to set 0 for some type, you could just remove the field
            "set": 5,
            "bundle": 5,
            "standard": 10
        },
    },
    "productsConfig": { // OPTIONAL
        "inclusions": [], // array of product ids needs to be included bypassing counter
        "includeIfDependency": false, // include parent product if inclusion is dependency with all parent dependencies
        "includeChildren": true // include dependencies
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
