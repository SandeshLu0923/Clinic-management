/**
 * Jest Configuration
 * Setup for testing the clinic management system backend
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/*.test.js',
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true,
  bail: false,
  testTimeout: 10000,
};
