module.exports = {
    "root": true,
    "env": {
        "node": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "spellcheck"
    ],
    "rules": {
        "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "spellcheck/spell-checker": [1,
            {
                "skipWords": [
                    "closematchedtag",
                    "closetag",
                    "ds", // the ending of IDs
                    "emmiter",
                    "fs",
                    "globby",
                    "keyof",
                    "matcher",
                    "navigations",
                    "openmatchedtag",
                    "opentag",
                    "postfix",
                    "pricebook",
                    "readdir",
                    "readonly",
                    "uncategorized",
                    "unlink",
                    "xml"
                ],
            }
        ]
    }
}
