const path = require('path');

const getRoutes = () => {
  if (process.env.USE_LOCAL_RASA && process.env.USE_LOCAL_RASA !== '') {
    return {
      '/api/virtual-assistant/v1': { host: 'http://localhost:5005' },
    };
  }

  return undefined;
};

module.exports = {
  appUrl: [],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  routes: getRoutes(),
  interceptChromeConfig: true,
  moduleFederation: {
    exposes: {
      './AstroVirtualAssistant': path.resolve(__dirname, './src/SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant.tsx'),
    },
  },
  plugins: [],
  sassPrefix: '.virtualAssistant',
  _unstableHotReload: process.env.HOT === 'true',
};
