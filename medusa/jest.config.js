const { loadEnv } = require("@medusajs/utils");

// Load test environment configuration
loadEnv("test", process.cwd());

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],

  // E2E test configuration
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/jest-setup.ts"],
  testTimeout: 60000, // 60 seconds for E2E tests

  // Global test configuration
  globals: {
    "ts-jest": {
      useESM: false,
    },
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/test-utils/**",
  ],
};

// Test type configuration
if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "e2e") {
  // E2E tests using new infrastructure
  module.exports.testMatch = ["**/src/**/__tests__/**/*.e2e.spec.[jt]s"];
  module.exports.setupFilesAfterEnv = ["<rootDir>/src/test-utils/jest-e2e-setup.ts"];
}
