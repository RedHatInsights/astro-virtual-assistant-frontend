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
  // routes: getRoutes(),
  routes: {
    '/apps/assisted-installer-app': { host: 'http://localhost:8003' },
  },
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
      './ArhChatbot': path.resolve(__dirname, './src/chatbots/ArhChatbot.ts'),
      './RhelLightSpeedChatbot': path.resolve(__dirname, './src/chatbots/RhelLightSpeedChatbot.ts'),
      './VaChatbot': path.resolve(__dirname, './src/chatbots/VaChatbot.ts'),
      ...extraExposes,
    },
  },
  plugins: [],
  sassPrefix: '.virtualAssistant',
  hotReload: process.env.HOT === 'true',
};
