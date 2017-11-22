module.exports = {
    root: true,
    // parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: true
    },
    extends: 'standard',
    rules: {
        // allow paren-less arrow functions
        'arrow-parens': 0,
        // allow async-await
        'generator-star-spacing': 0,
        'indent': ['error', 4, {
            'SwitchCase': 1
        }],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-return-assign': 0,
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'ignore',
            'asyncArrow': 'always'
        }],
        'no-unused-expressions': ['error', {
            'allowTaggedTemplates': true,
            'allowShortCircuit': true,
            'allowTernary': true
        }]
    },
    globals: {
        PIXI: true,
        sounds: true
    }
}
