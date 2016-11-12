const WebpackMochaPlugin = require('../../../release');
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