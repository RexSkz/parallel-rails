var webpack = require('webpack');
var path = require('path');
var autoprefixer = require('autoprefixer');

var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'src');
var BUILD_PATH = path.resolve(ROOT_PATH, 'dist');

module.exports = {
    devtool: 'source-map',
    entry: ['whatwg-fetch', 'pixi.js', './src/Main.js'],
    output: {
        path: BUILD_PATH,
        filename: 'parallel-rails.min.js',
        library: 'ParallelRails',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    devServer: {
        publicPath: "/dist/",
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            include: APP_PATH,
            query: {
                presets: ['es2015'],
            },
        }, {
            test: /\.css$/,
            loaders: ['style', 'css', 'postcss', 'sass'],
            include: APP_PATH,
        }],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: true,
            },
        })
    ],
    postcss: [autoprefixer({ browsers: ['last 10 versions'] })],
};
