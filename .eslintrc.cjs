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
        "spellcheck/spell-checker": ["warn"]
    }
}
