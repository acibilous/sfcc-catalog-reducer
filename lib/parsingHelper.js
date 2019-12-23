function getProductTypeByRawString (rawString) {
    if (rawString.includes('bundled-products>')) {
        type = 'bundle';
    } else if (rawString.includes('product-set-products>')) {
        type = 'set';
    } else if (rawString.includes('variations>')) {
        type = 'master';
    } else {
        type = 'standard';
    }

    return type;
}

function findMatches(regex, str, matches = []) {
    const res = regex.exec(str)
    res && matches.push(res) && findMatches(regex, str, matches)
    return matches
}

module.exports = {
    getProductTypeByRawString,
    findMatches
}