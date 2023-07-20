const getRoutes = () => {
  if (process.env.USE_LOCAL_RASA && process.env.USE_LOCAL_RASA !== '') {
    return {
      '/api/virtual-assistant': { host: 'http://localhost:5005' },
    };
  }

  return undefined;
};

module.exports = {
  appUrl: ['/staging/virtual-assistant'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  routes: getRoutes(),
  /**
   * Change to false after your app is registered in configuration files
   */
  interceptChromeConfig: true,
  /**
   * Add additional webpack plugins
   */
  plugins: [],
  sassPrefix: '.virtualAssistant',
  _unstableHotReload: process.env.HOT === 'true',
};
