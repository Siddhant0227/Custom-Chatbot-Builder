

// frontend/craco.config.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  devServer: { // craco uses a direct devServer object for configuration
    setupMiddlewares: (middlewares, devServer) => {
      if (devServer) {
        // Add the proxy middleware for /api routes
        middlewares.unshift(
          createProxyMiddleware('/api', {
            target: 'http://127.0.0.1:8000', // Your Django backend URL
            changeOrigin: true,
            secure: false, 
            pathRewrite: {
              '^/api': '/api', 
            },
            logLevel: 'debug', 
          })
        );
      }
      return middlewares;
    },
  },
  // If you had production build configurations in your old config-overrides.js,
  // you would need to adapt them here under a 'webpack' property.
  // For example:
  // webpack: {
  //   configure: (webpackConfig, { env, paths }) => {
  //     if (env === 'production') {
  //       // Your production build overrides go here
  //       // e.g., webpackConfig.entry = path.resolve(__dirname, 'src/components/ChatbotPreview.jsx');
  //       // etc.
  //     }
  //     return webpackConfig;
  //   },
  // },
};