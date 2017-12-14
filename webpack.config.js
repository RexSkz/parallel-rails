const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');

const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'game/lib');

const development = process.env.NODE_ENV === 'development';

module.exports = {
    devtool: development ? 'cheap-module-eval-source-map' : 'cheap-module-source-map',
    entry: ['whatwg-fetch', 'moment', './src/Main.js'],
    output: {
        path: BUILD_PATH,
        filename: 'parallel-rails.min.js',
        library: 'ParallelRails',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            include: APP_PATH,
            query: {
                presets: ['env']
            }
        }, {
            test: /\.css$/,
            loaders: ['style', 'css', 'postcss'],
            include: APP_PATH
        }]
    },
    plugins: [
        development && new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ],
    postcss: [autoprefixer({ browsers: ['last 10 versions'] })]
};
