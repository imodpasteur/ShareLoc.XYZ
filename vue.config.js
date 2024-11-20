const siteConfig = require('./site.config.json');
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
siteConfig['BASE_URL'] = process.env.BASE_URL
module.exports = {
  chainWebpack: config => {
     // Rule for `.vue` files
     config.module
     .rule('vue')
     .use('vue-loader')
     .loader('vue-loader')
     .tap(options => options);

   // Rule for `js` files inside `src`
   config.module
     .rule('js')
     .test(/\.js$/)
     .include.add(path.resolve(__dirname, 'src'))
     .end()
     .use('babel-loader')
     .loader('babel-loader');

   // Rule for `hypha-rpc` package in `node_modules` with optional chaining plugin
   config.module
     .rule('hypha-rpc')
     .test(/\.js$/)
     .include.add(/node_modules\/hypha-rpc/)
     .end()
     .use('babel-loader')
     .loader('babel-loader')
     .tap(options => ({
       ...options,
       plugins: ["@babel/plugin-proposal-optional-chaining"],
     }));
  },
  publicPath: '/',
  pwa: {
    workboxPluginMode: 'GenerateSW',
      workboxOptions: {
          skipWaiting: true
      }
  },
  configureWebpack: {
    plugins: [
      new HtmlWebpackPlugin({
        templateParameters: siteConfig,
        template : './public/index.ejs'
      }),
      new CopyWebpackPlugin([{
        from: path.join(__dirname, "docs"),
        to: path.join(__dirname, "dist/docs"),
        toType: "dir"
      }])
    ]
  }
}