const path = require("path");
const webpack = require("webpack");

const GLOBALS = {
    "process.env.NODE_ENV": JSON.stringify("production")
};
const PRODUCTION = (process.env.NODE_ENV === "production");



module.exports = {

    mode: "development",
    entry: [
        "webpack-hot-middleware/client?reload=true",
        "./src/index.js",  // Main entry point of the library
    ],

    devtool: "eval-source-map",  // ?
    target: "web",  // ?

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ],

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve(__dirname, "src"),
                ],

                enforce: "pre",

                loader: require.resolve("eslint-loader"),
                options: {
                },
            },
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve(__dirname, "src"),
                ],

                loader: "babel-loader",
                options: {
                    cacheDirectory: true,
                }

                // FIXME: Add preprocessor with INCLUDE_GUI: true
            },
            {
                test: /\.css$/,

                loader: "style!css?sourceMap",
            },
            {
                test: /\.scss$/,

                loader: "style!css?sourceMap!resolve-url!sass?sourceMap",
            },
            {
                test: /\.(svg|png|jpe?g|gif)(\?\S*)?$/,
                loader: "url-loader",
                options: {
                    limit: 100000,
                    name: "img/[name].[ext]",
                }
            },
            {
                test: /\.(eot|woff|woff2|ttf)(\?\S*)?$/,
                loader: "url-loader",
                options: {
                    limit: 100000,
                    name: "img/[name].[ext]",
                }
            },
        ]
    },

    // Determine how to resolve module imports requests
    resolve: {

        // directories where to look for modules
        modules: [
            "node_modules",
            path.resolve(__dirname, "src")
        ],

        // extensions that are used
        extensions: [".js", ".json", ".jsx", ".css", ".scss"],
    },

    output: {
        pathinfo: true,
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
        filename: "literallycanvas.bundle.js"
    },
    devServer: {
        contentBase: "./"   // ?
    },
};