import webpack from 'webpack'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { VueLoaderPlugin } from 'vue-loader'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ModuleFederationComponentPlugin from '@mf-demo/mf-vue-isolation/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { ModuleFederationPlugin } = webpack.container

const remote2Namespace = '.remote2-mf'
const postcssSelectorNamespaceModule = require('postcss-selector-namespace')
const postcssSelectorNamespace =
  postcssSelectorNamespaceModule.default || postcssSelectorNamespaceModule

export default {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/bootstrap.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    publicPath: 'auto',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: { esmodules: true } }],
            ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
            '@vue/babel-preset-app',
          ],
          plugins: [['@babel/plugin-transform-typescript', { allowNamespaces: true }]],
        },
      },
      {
        test: /\.css$/,
        oneOf: [
          {
            resourceQuery: /mf/,
            use: [
              'vue-style-loader',
              { loader: 'css-loader', options: { importLoaders: 1 } },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [postcssSelectorNamespace({ namespace: remote2Namespace })],
                  },
                },
              },
            ],
          },
          {
            use: ['vue-style-loader', 'css-loader'],
          },
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({ template: './index.html', filename: 'index.html' }),
    new webpack.DefinePlugin({
      'import.meta.env.BASE_URL': JSON.stringify('/'),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    }),
    new ModuleFederationPlugin({
      name: 'remote2',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/views/Dashboard.vue',
      },
      shared: {
        vue: { singleton: true, eager: true },
      },
    }),
    new ModuleFederationComponentPlugin({
      wrapperClassName: 'remote2-mf',
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    port: 3002,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    static: { directory: path.join(__dirname, 'dist') },
    hot: true,
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return chunk.filenameTemplate !== 'remoteEntry.js'
      },
    },
  },
}
