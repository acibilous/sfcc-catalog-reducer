# Catalog Reducer for SFCC (Demandware)

## How it works?

### Preconditions

Please update your project package.json with configuration:

```
{
    "catalogReducer": {
        "src": {
            "master": "./data/master.xml",
            "navigation": "./data/navigation.xml"
        },
        "categoriesConfig": {
            "default": {
                "master": 1,
                "set": 1,
                "bundle": 1,
                "standard": 10
            },
            "men": {
                "master": 10,
                "set": 10,
                "bundle": 10,
                "standard": 20
            }
        }
    }
}
```