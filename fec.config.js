module.exports = {
  appUrl: ['/staging/virtual-assistant'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
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
