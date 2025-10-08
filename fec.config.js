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
      './useArhChatbot': path.resolve(__dirname, './src/aiClients/useArhClient.ts'),
      './useRhelChatbot': path.resolve(__dirname, './src/aiClients/useRhelLightSpeedManager.ts'),
      './useVaChatbot': path.resolve(__dirname, './src/aiClients/useVaManager.ts'),
      ...extraExposes,
    },
  },
  plugins: [],
  sassPrefix: '.virtualAssistant',
  hotReload: process.env.HOT === 'true',
};
