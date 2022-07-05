export type ProductType = 'master' | 'masterWithVariationGroups' | 'set' | 'bundle' | 'standard';

export type ProductsConfig = {
    onlineFlagCheck: boolean 
};

export type CategoryConfig = {
    master: number | Array<string>;
    masterWithVariationGroups: number | Array<string>;
    set: number | Array<string>;
    bundle: number | Array<string>;
    standard: number | Array<string>;
};

export type SpecificCategoryConfigs = {
    [categoryId: string]: CategoryConfig | 'keepAsIs';
}

export type GeneralCategoryConfigs = {
    $default: CategoryConfig;
}

export type CategoryConfigs = GeneralCategoryConfigs & SpecificCategoryConfigs;

export type SrcConfig = {
    masters: Array<string>;
    navigations: Array<string>;
    inventories?: Array<string>;
    priceBooks?: Array<string>;
};

export type CatalogReducerConfig = {
    outPostfix: string;
    behavior: 'createNew' | 'updateExisting';
    src: SrcConfig;
    generateMissingRecords: {
        inventoryAllocation: false | number;
        price: false | number;
    };
    categoriesConfig: CategoryConfigs;
    productsConfig: ProductsConfig;
};

export type XMLTag = {
    name: string;
    attributes: Record<string, string>;
};

export type XMLProductDefinition = InstanceType<typeof import('#xml/XMLProductDefinition').default>;

export type XMLParserEventName = 'openmatchedtag' | 'closematchedtag';
export type XMLMatcherEventName = XMLParserEventName | 'end' | 'match';
export type XMLFilterWriterEventName = XMLMatcherEventName | 'afterLastMatch';

export type XMLTagHandler = (tag: XMLTag, raw: string) => void;
export type XMLTagFilter = (tag: XMLTag, raw: string) => boolean;
