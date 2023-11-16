const path = require('path');

module.exports = {
  appUrl: [],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
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
