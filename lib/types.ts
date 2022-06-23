export type ProductType = 'master' | 'masterWithVariationGroups' | 'set' | 'bundle' | 'standard';

export type Product = {
    type: ProductType;
    dependencies: Array<string>; // array of product IDs
};

export type Category = {
    [categoryId: string]: Product;
};

export type ProductsConfig = {
    onlineFlagCheck: boolean 
};

export type CategoryConfig = {
    master: number;
    masterWithVariationGroups: number;
    set: number;
    bundle: number;
    standard: number;
};

export type CategoryProductsContainer = {
    master: Array<string>;
    set: Array<string>;
    bundle: Array<string>;
    standard: Array<string>;
};

export type SpecificCategoryConfigs = {
    [categoryId: string]: CategoryConfig;
}

export type GeneralCategoryConfigs = {
    $default: CategoryConfig;
}

export type CategoryConfigs = GeneralCategoryConfigs & SpecificCategoryConfigs;

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
    categoriesConfig: CategoryConfigs;
    productsConfig: ProductsConfig;
};

export type XMLTag = {
    name: string;
    attributes: Record<string, string>;
};

export type XMLParserEventName = 'openmatchedtag' | 'closematchedtag';
export type XMLMatcherEventName = XMLParserEventName | 'end' | 'match';

export type XMLTagHandler = (tag: XMLTag, raw: string) => void;
export type XMLTagFilter = (tag: XMLTag) => boolean;
