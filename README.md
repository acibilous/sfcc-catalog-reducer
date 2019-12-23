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
            "master": "./testdata/master.xml",
            "navigation": "./testdata/navigation.xml"
        },
        "categoriesConfig": {
            "default": {
                "master": 1,
                "set": 1,
                "bundle": 1,
                "standard": 10
            },
            "YOUR_CUSTOM_CATEGORY_CONFIG": {
                "master": 5,
                "set": 4,
                "bundle": 8,
                "standard": 50
            }
        }
    }
}
```