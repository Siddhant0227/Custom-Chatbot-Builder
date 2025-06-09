// config-overrides.js
const { override, addWebpackPlugin } = require('customize-cra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = override(
  // Ensure HtmlWebpackPlugin is correctly configured to generate index.html
  // This assumes your public/index.html is the template for the final index.html
  addWebpackPlugin(
    new HtmlWebpackPlugin({
      inject: true, // Inject all compiled assets (JS, CSS) into the HTML
      template: path.resolve(__dirname, 'public/index.html'), // Path to your source index.html template
      filename: 'index.html', // Output filename
      // Add other options as needed, e.g., minify for production
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    })
  ),

  // If you had specific Webpack 'output' configurations for a widget (e.g., library, libraryTarget),
  // you might need to remove or modify them here to revert to standard SPA output.
  // For example, if you had a 'setWebpackPublicPath' or similar override, check it carefully.
  // A standard SPA build typically doesn't need to specify 'library' or 'libraryTarget'.
  (config) => {
    // This part ensures Webpack's output is for a standard web app.
    // If your project was modified to build a library/widget, it might have
    // 'library' or 'libraryTarget' set in config.output. Delete them if they exist.
    delete config.output.library;
    delete config.output.libraryTarget;
    // Ensure publicPath is correct for relative paths in build
    config.output.publicPath = '/'; // Or '.' if you want relative paths for static files

    // Ensure the entry point is typically 'src/index.js' for an SPA
    // If your entry was changed to something like 'src/my-chatbot-widget.js', you might need to revert it
    // config.entry = path.resolve(__dirname, 'src/index.js'); // Uncomment if your entry point was changed

    return config;
  }
);