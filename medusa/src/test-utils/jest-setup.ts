/**
 * Jest Setup File
 *
 * Global setup for Jest tests, particularly for offline testing
 */

// Extend Jest matchers if needed
// import { toMatchSnapshot } from 'jest-extended';
// expect.extend({ toMatchSnapshot });

// Global test timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress known warnings during tests
  console.warn = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('deprecated') || message.includes('experimental'))
    ) {
      return;
    }
    originalConsoleWarn(message);
  });

  console.error = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      message.includes('Warning:')
    ) {
      return;
    }
    originalConsoleError(message);
  });
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  generateId: (prefix = 'test') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`,
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Type declarations for global utilities
declare global {
  var testUtils: {
    generateId: (prefix?: string) => string;
    delay: (ms: number) => Promise<void>;
  };
}