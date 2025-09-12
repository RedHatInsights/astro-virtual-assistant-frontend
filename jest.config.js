module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/**/stories/*'],
  coverageDirectory: './coverage/',
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^@scalprum/core$': '<rootDir>/src/__mocks__/scalprum.js',
    '^@patternfly/chatbot$': '<rootDir>/src/__mocks__/@patternfly/chatbot.js',
  },
  roots: ['<rootDir>/src/'],
  transformIgnorePatterns: ['/node_modules/(?!(@redhat-cloud-services|@patternfly)/)'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: [
    'node_modules',
    './src', //the root directory
  ],
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
};
