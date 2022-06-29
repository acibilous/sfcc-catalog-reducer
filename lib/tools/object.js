/**
 * @template T 
 * @param {T} object 
 * @param {(key: keyof T) => boolean} filter
 * @returns {Partial<T>}
 */
export const filterKeys = (object, filter) => {
    return Object
        .entries(object)
        .filter(([key]) => filter(key))
        .reduce((accumulator, [key, value]) => ({
            ...accumulator,
            [key]: value
        }), {});
}
