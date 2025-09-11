import '@testing-library/jest-dom';
const crypto = require('crypto');

// Crypto object polyfill for JSDOM
global.window.crypto = {
  ...crypto,
};
// in case the cryto package is mangled and the method does not exist
if (!global.window.crypto.randomUUID) {
  global.window.crypto.randomUUID = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
}
