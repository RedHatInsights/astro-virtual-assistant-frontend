const path = require('path');

const extraExposes = {};

const getRoutes = () => {
  if (process.env.USE_LOCAL_RASA && process.env.USE_LOCAL_RASA !== '') {
    return {
      '/api/virtual-assistant/v2': { host: 'http://localhost:5000' },
    };
  }

  return undefined;
};

module.exports = {
  appUrl: ['/go-to-landing-page'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  routes: getRoutes(),
  interceptChromeConfig: false,
  moduleFederation: {
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          version: '^6.3.0',
        },
      },
    ],
    exposes: {
      './AstroVirtualAssistant': path.resolve(__dirname, './src/SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant.tsx'),
      // The dynamic LSC module should be eventually exposed in the OpenShift assisted installer app
      './AsyncLSC': path.resolve(__dirname, './src/asyncClientInit/AsyncLSC.tsx'),
      ...extraExposes,
    },
  },
  plugins: [],
  sassPrefix: '.virtualAssistant',
  hotReload: process.env.HOT === 'true',
};
