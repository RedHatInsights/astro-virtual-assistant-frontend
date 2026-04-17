# Testing Guidelines

## Frameworks

- **Jest 29** with `ts-jest` for unit tests (hooks, utilities, business logic)
- **Cypress 13** for component tests (UI interactions, accessibility)
- **Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`) for React component assertions

## Test Location

- Jest tests: colocated with source in `src/**/__tests__/` directories
- Cypress component tests: `cypress/components/`
- Test mocks: `src/__mocks__/` for third-party package mocks, `cypress/mocks/` for Cypress-specific mocks

## Running Tests

```bash
npm test              # Jest unit tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Jest with coverage report
npm run cypress:run:cp # Cypress component tests (headless)
```

## Jest Configuration

- Environment: `jsdom`
- Setup file: `config/jest.setup.ts` (includes `crypto` polyfill for JSDOM)
- Module name mapping via `tsconfig` paths
- Transform: `ts-jest` with `tsconfig.json`

## Mocking Strategy

### Third-Party Packages

Mocks for external packages live in `src/__mocks__/`:

- `@patternfly/chatbot` — mock chatbot UI components
- `@scalprum/react-core` — mock Scalprum hooks (`useModule`, `ScalprumProvider`)
- `@redhat-cloud-services/ai-client-state` — mock state manager factory
- `@redhat-cloud-services/ai-react-state` — mock conversation/message hooks
- `@redhat-cloud-services/frontend-components/useChrome` — mock Chrome context (auth, analytics, user)

### Chrome Mock Pattern

Always mock `useChrome` to provide auth tokens and user context:

```typescript
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: () => ({
    auth: {
      getToken: jest.fn().mockResolvedValue('mock-token'),
      getUser: jest.fn().mockResolvedValue({ identity: { user: { username: 'test-user' } } }),
    },
    analytics: { track: jest.fn() },
  }),
}));
```

### AI Client Mocks

When testing AI client hooks (`useArhClient`, `useVaManager`, etc.), mock the underlying client library and the state manager factory. Do not make real API calls in tests.

## Cypress Component Tests

### Setup

- Webpack config: `config/webpack.cy.config.js`
- Scalprum provider mock: `cypress/mocks/ScalprumMock.tsx`
- All component tests wrap components in the Scalprum mock provider

### Pattern

```typescript
import { mount } from 'cypress/react18';
import { ScalprumMock } from '../../mocks/ScalprumMock';

describe('Component', () => {
  it('renders correctly', () => {
    mount(
      <ScalprumMock>
        <YourComponent />
      </ScalprumMock>
    );
    cy.get('[data-testid="..."]').should('exist');
  });
});
```

### Accessibility

Cypress tests should verify keyboard navigation and ARIA attributes where applicable. PatternFly components provide built-in accessibility — verify it is preserved in custom wrappers.

## What to Test

- **Jest**: Hook logic, state transitions, API client behavior, utility functions, error handling paths
- **Cypress**: User interactions (click, type, select), component rendering with different props/states, integration between components

## What NOT to Test

- PatternFly component internals (they have their own tests)
- Scalprum module federation mechanics
- Third-party library behavior
