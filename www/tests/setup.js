// Jest setup file for DOM testing

// Mock global objects
global.window = global.window || {};
global.document = global.document || {};

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
