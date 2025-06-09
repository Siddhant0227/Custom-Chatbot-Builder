const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function override(config, env) {
  if (env === 'production') {
    // Set the entry point to your ChatbotPreview.jsx
    config.entry = path.resolve(__dirname, 'src/components/ChatbotPreview.jsx');

    config.output = {
      ...config.output,
      filename: 'my-chatbot-widget.bundle.js',
      path: path.resolve(__dirname, 'build'), 
      library: 'MyChatbotWidget',
      libraryTarget: 'window',
      publicPath: '',
      clean: false,
    };

    config.optimization = {
      minimize: true,
      runtimeChunk: false,
      splitChunks: {
        cacheGroups: {
          default: false,
          vendors: false,
        },
      },
    };

    // Filter out plugins that are not necessary for a simple widget bundle
    config.plugins = config.plugins.filter(
      (plugin) =>
        plugin.constructor.name !== 'HtmlWebpackPlugin' &&
        plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin' &&
        plugin.constructor.name !== 'ESLintWebpackPlugin'
    );

    // Ensure MiniCssExtractPlugin is added to the plugins array
    const hasMiniCssExtractPlugin = config.plugins.some(
      (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
    );

    if (!hasMiniCssExtractPlugin) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          // Changed: Output CSS into 'build/css/' relative to the new output.path ('build')
          filename: 'css/my-chatbot-widget.bundle.css',
          chunkFilename: 'css/[id].chunk.css',
        })
      );
    }
  }
  return config;
};