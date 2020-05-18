# Catalog Reducer for SFCC (Demandware)

>At all module based on modifyied [SaxJS](https://www.npmjs.com/package/sax) library. It's using nodejs streams to work with huge xml files.

## How it works?

Now it reducing master catalog based on the next logic
- Read master catalog xml to map products with their dependencies (master-variation, etc.)
- Read navigation catalog xml to collect category assignments
- Merge those 2 registries in navigation one to filter not assigned products and collect dependencies of assigned in navigation
- Read master catalog again and simultaneously write another one based on registry from previous step and provided configuration in `package.json`

## Configuration

Please update your project `package.json` with configuration:

```
{
    "catalogReducer": {
        "src": {
            "master": "./testdata/real/master.xml", //master catalog file
            "navigation": "./testdata/real/navigation.xml", //navigation catalog file, may be same as master if just one catalog
            "minifiedMaster": "./testdata/real/master_minified.xml" // output master catalog file after finishing minification
        },
        "enabledCache": true, // to read master and navigation catalog data from JSONs if existing
        "cleanupData": false, // to remove master, navigation and minified master catalog data JSONs after processing 
        "categoriesConfig": {
            "CATEGORY_ID_CUSTOM_CONFIGURATION": {
                "master": 5,
                "set": 5,
                "bundle": 5,
                "standard": 10
            },
            "default": {
                "master": 1,
                "set": 1,
                "bundle": 1,
                "standard": 0 // not included dependencies from master, set or bundle
            }
        },
        "productsConfig": {
            inclusions: [], // array of product ids needs to be included bypassing counter
            includeIfDependency: false, // include parent product if inclusion is dependency with all parent dependencies
            includeChildren: true // include dependencies
        }
    }
}
```