/**
 * Jest Setup File
 * Configure test environment before running tests
 */
require('dotenv').config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional)
// global.console = { ...console, log: jest.fn(), error: jest.fn() };
