import webpack from 'webpack'
import path from 'path'
import { fileURLToPath } from 'url'
import { VueLoaderPlugin } from 'vue-loader'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { getSharedConfigFromManifest } from '../../scripts/shared-config-from-manifest.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { ModuleFederationPlugin } = webpack.container

// 主应用 shared 由 shared-manifest.json 生成，remote1/remote2 等通过 usedBy 消费这些依赖
const manifestPath = path.resolve(__dirname, '../../shared-manifest.json')
const sharedFromManifest = getSharedConfigFromManifest(manifestPath, { eager: ['vue', 'vue-router'] })
const shared = Object.keys(sharedFromManifest).length > 0
  ? sharedFromManifest
  : {
      vue: { singleton: true, eager: true },
      'vue-router': { singleton: true, eager: true },
      pinia: { singleton: true, eager: true },
      lodash: { singleton: true, requiredVersion: '^4.17.21' },
      'element-plus': { singleton: true, requiredVersion: '^2.4.0' },
      axios: { singleton: true, requiredVersion: '^1.6.0' },
    }

export default {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    publicPath: '/',
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
          ],
          plugins: [['@babel/plugin-transform-typescript', { allowNamespaces: true }]],
        },
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
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
    // remotes 仅用于运行时容器名解析；不在此处做任何 import('remote1/...')，remoteEntry 由路由按需 loadScript 加载
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      exposes: {
        './store': './src/store/index.ts',
        './sharedStateBridge': './src/shared/stateBridge.ts',
        './api': './src/api/client.ts',
        './navigate': './src/shared/navigate.ts',
      },
      remotes: {
        remote1: 'remote1@http://localhost:3001/remoteEntry.js',
        remote2: 'remote2@http://localhost:3002/remoteEntry.js',
        remote3: 'remote3@http://localhost:3003/remoteEntry.js',
      },
      shared,
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
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    static: { directory: path.join(__dirname, 'dist') },
    historyApiFallback: { index: '/index.html' },
    hot: true,
  },
}
