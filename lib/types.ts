export type ProductType = 'master' | 'set' | 'bundle' | 'standard';

export type Product = {
    type: ProductType;
    dependencies: Array<string>; // array of product IDs
};

export type Category = {
    [categoryId: string]: Product;
};

export type ProductsConfig = {
    inclusions: Array<string>;
    includeIfDependency: boolean;
    includeChildren: boolean;
};

export type CategoryConfig = {
    master: number;
    set: number;
    bundle: number;
    standard: number;
};

export type CategoriesConfig = {
    $default: CategoryConfig;
    [categoryId: string]: CategoryConfig;
};

export type SrcConfig = {
    finalCacheDir: string;
    masters: Array<string>;
    navigations: Array<string>;
    inventories?: Array<string>;
    priceBooks?: Array<string>;
};

export type CatalogReducerConfig = {
    outPostfix: string;
    behavior: 'createNew' | 'updateExisting';
    src: SrcConfig;
    enabledCache: boolean;
    cleanupData: boolean;
    categoriesConfig: CategoriesConfig;
    productsConfig?: ProductsConfig;
};

export type XMLTag = {
    name: string;
    attributes: Record<string, string>;
};

export type XMLParserEventName = 'openmatchedtag' | 'closematchedtag';
export type XMLMatcherEventName = XMLParserEventName | 'end' | 'match';

export type XMLTagFilter = (tag: XMLTag) => boolean;

export type ProductsRegistry = typeof import('./catalog/registry/ProductsRegistry');
