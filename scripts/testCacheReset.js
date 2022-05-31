import { getCleaner } from '../lib/tools/cleanup.js';
import { getFilesByPatterns, createFolderIfNotExists } from '../lib/tools/files.js';
import { config } from '../constants.js';

/**
 * @description Entry point
 */
(async () => {
    const [masterFiles, navigationFiles, inventoryFiles, priceBookFiles] = await Promise.all([
        getFilesByPatterns(config.src.masters),
        getFilesByPatterns(config.src.navigations),
        getFilesByPatterns(config.src.inventories),
        getFilesByPatterns(config.src.priceBooks),
        createFolderIfNotExists(config.src.finalCacheDir)
    ]);

    const cleaner = getCleaner([
        ...masterFiles,
        ...navigationFiles,
        ...inventoryFiles,
        ...priceBookFiles
    ], config.src.finalCacheDir);

    cleaner();
})();
