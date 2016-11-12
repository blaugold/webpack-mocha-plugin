## webpack-mocha-plugin
Webpack plugin integration with mocha testing framework + coverage with istanbul.

[![CircleCI](https://circleci.com/gh/blaugold/webpack-mocha-plugin/tree/master.svg?style=svg&circle-token=6120e3250facc9807944a407480a3705b171216e)](https://circleci.com/gh/blaugold/webpack-mocha-plugin/tree/master)

## Installation
```bash
    npm i -D webpack-mocha-plugin mocha istanbul remap-istanbul
```

### Webpack Config
This webpack configuration will run your tests and write a html and json coverage report to
`coverage`, after webpack compiles the project. If webpack is in watch mode tests are run after
each compilation.
You can configure entry and output how ever you like. The plugin will add all generated files
ending in `.js` to the mocha test.
```javascript
    const WebpackMochaPlugin = require('webpack-mocha-plugin');
    const nodeExternals = require('webpack-node-externals');
    
    module.exports = {
        target: 'node',
    
        entry: {
            test: __dirname + '/test.bundle.ts'
        },
    
        output: {
            path: '.tmp/test',
            filename: '[name].bundle.js'
        },
    
        resolve: {
            extensions: ['.ts', '.js']
        },
    
        externals: [nodeExternals()],
    
        devtool: 'inline-source-map',
    
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    loader: 'source-map'
                },
                {
                    test: /\.ts$/,
                    loader: 'awesome-typescript'
                },
                {
                    enforce: 'post',
                    test: /\.(js|ts)$/,
                    // Exlude tests so they don't show up in coverage report.
                    exclude: /\.(spec)\.(ts|js)$/,
                    loader: 'sourcemap-istanbul-instrumenter',
                    query: {
                        'force-sourcemap': true
                    }
                }
            ]
        },
    
        plugins: [
            new WebpackMochaPlugin({
                codeCoverage: true
            })
        ]
    };
```

## Options
```javascript
    new WebpackMochaPlugin({
        mocha?: any = {};
        codeCoverage?: boolean = false;
        coverageVariable?: string = '__coverage__';
        coverageReports?: string[] = ['html', 'json'];
        coverageDir?: string = 'coverage';
    })
```

You can pass all options which the Mocha JS API takes in `mocha`.
`codeCoverage` enables or disables generation of a report.
`coverageVariable` is where the instrumenter puts the coverage information.
`coverageReports` takes all reporters which `istanbul` can generate.
`coverageDir` is the directory where the coverage report will be stored.

## Test Bundle
```javascript
    // This will only inlcude spec files and files required by them in the coverage report.
    // Tell webpack to bundle all spec files in a context.
    const ctx = require.context('src', true, /\.(spec)\.js/)
    
    // Evaluate all modules in context.
    ctx.keys().map(moduleId => ctx(moduleId))
    
    // This will include all files in the src directory so untest code shows up in the coverage
    // report.
    // Tell webpack to bundle all source files in a context.
    const ctx = require.context('src', true, /\.js/)
    
    // Evaluate all modules in context.
    ctx.keys().map(moduleId => ctx(moduleId))
```