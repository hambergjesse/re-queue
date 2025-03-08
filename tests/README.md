# RE:Q Testing Framework

This directory contains comprehensive tests for the RE:Q extension to ensure functionality across all supported browsers (Chrome, Firefox, Edge, and Opera).

## Testing Approach

We use a multi-layered testing approach:

1. **Unit Tests**: Testing individual functions and components in isolation
2. **Integration Tests**: Testing communication between extension components
3. **End-to-End Tests**: Testing the complete extension in actual browser environments
4. **Manual Test Checklist**: For final verification before releases

## Test Directory Structure

```
tests/
├── unit/                 # Unit tests
│   ├── background.test.js
│   ├── content.test.js
│   └── popup.test.js
├── integration/          # Integration tests
│   ├── background-content.test.js
│   └── popup-background.test.js
├── e2e/                  # End-to-end tests
│   ├── chrome.test.js
│   ├── firefox.test.js
│   └── helpers/
├── mocks/                # Mock data and browser API mocks
│   ├── chrome-api.mock.js
│   └── dom-elements.mock.js
├── manual/               # Manual testing checklist
│   └── pre-release-checklist.md
└── README.md             # This file
```

## Running Tests

```bash
# Install dependencies
npm install

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm test
```

## Continuous Integration

Tests are automatically run on:
- Every commit pushed to the repository
- Every pull request
- Before creating release packages

## Test Coverage Requirements

We require the following minimum coverage levels:
- Unit tests: 90% code coverage
- Integration tests: 80% coverage of communication pathways
- E2E tests: Must pass on all supported browsers

## Contributing New Tests

When adding new features, please:
1. Add corresponding unit tests for all new functions/methods
2. Update integration tests if the feature involves component communication
3. Add specific E2E test cases for user-facing features
4. Update the manual testing checklist if applicable 