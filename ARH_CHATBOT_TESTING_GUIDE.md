# ARH Chatbot Testing Guide

This guide provides comprehensive instructions for testing ARH (Ask Red Hat) chatbot components using **Cypress for component testing** and **Jest for hooks/utilities**.

## 🏗️ Test Architecture Overview

### Testing Strategy
- **Cypress Component Tests**: UI components, user interactions, accessibility
- **Jest Tests**: React hooks, utility functions, business logic  
- **Mocking Strategy**: Mock third-party dependencies to avoid network calls and ensure test isolation

### Key Dependencies to Mock
- `@redhat-cloud-services/arh-client` - API client
- `@redhat-cloud-services/ai-client-state` - State management
- `@redhat-cloud-services/ai-react-state` - React hooks and context

## 🧪 Jest Testing Setup

### Mock Files Location
Jest mocks are automatically loaded from `src/__mocks__/` directory:

```
src/__mocks__/
├── @redhat-cloud-services/
│   ├── arh-client.ts           # Mock IFDClient
│   ├── ai-client-state.ts      # Mock createClientStateManager  
│   └── ai-react-state.ts       # Mock React hooks and AIStateProvider
└── @patternfly/
    └── virtual-assistant.ts    # Mock PatternFly virtual assistant (fixes ES module issues)
```

### Example Hook Test
```typescript
// src/Components/ARHClient/__tests__/useScrollToBottom.test.ts
import { renderHook } from '@testing-library/react';
import useScrollToBottom from '../useScrollToBottom';

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useMessages: jest.fn(),
}));

describe('useScrollToBottom', () => {
  // Test implementation
});
```

### Running Jest Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

## 🔧 Cypress Component Testing Setup

### Key Pattern: Real AIStateContext with Mocked State Manager

**❌ WRONG APPROACH**: Custom mock contexts
**✅ CORRECT APPROACH**: Use real `AIStateContext` with mocked state manager

### TestWrapper Pattern
Every ARH component test should use this pattern:

```typescript
import React from 'react';
import { AIStateContext } from '@redhat-cloud-services/ai-react-state';

const createMockStateManager = () => {
  const state = {
    conversations: [],
    activeConversation: { id: 'test-conv', locked: false },
    messages: [],
    isInitializing: false,
    inProgress: false,
  };

  return {
    getState: () => state,
    createNewConversation: () => Promise.resolve(),
    setActiveConversation: () => {},
    sendMessage: () => {},
    subscribe: () => () => {},
    dispatch: () => {},
  };
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const mockStateManager = React.useMemo(() => createMockStateManager(), []);
  
  return (
    <AIStateContext.Provider value={mockStateManager}>
      {children}
    </AIStateContext.Provider>
  );
};

describe('ARH Component', () => {
  it('should render correctly', () => {
    cy.mount(
      <TestWrapper>
        <ARHComponent />
      </TestWrapper>
    );
    
    // Tests here...
  });
});
```

## 🎯 Proper PatternFly Chatbot Selectors

**❌ AVOID**: Generic selectors like `cy.get('body').should('not.be.empty')`

**✅ USE**: Specific PatternFly chatbot selectors by reading the node modules:

### Core Chatbot Selectors
```typescript
// Main containers
cy.get('#ai-chatbot')                              // ARH chatbot container
cy.get('.pf-chatbot__content')                     // ChatbotContent
cy.get('.pf-chatbot__messagebox[role="region"]')   // MessageBox

// Header components  
cy.get('.pf-chatbot__menu')                        // Menu containers
cy.get('button.pf-chatbot__button--toggle-menu')   // Menu/close buttons
cy.get('button[aria-label="Toggle menu"]')         // Menu toggle
cy.get('button[aria-label="Close"]')               // Close button

// Footer components
cy.get('button.pf-chatbot__button--send')          // Send button
cy.get('button[aria-label="Send button"]')         // Send button by aria-label
cy.get('#query-input')                             // Message input

// Welcome/Messages
cy.get('.pf-chatbot--layout--welcome')             // Welcome prompt
cy.get('.pf-chatbot__question')                    // Welcome description

// Alerts/Banners
cy.get('.pf-v6-c-alert')                          // PatternFly alerts
cy.get('.pf-v6-c-alert__action button')           // Alert close buttons
```

### How to Find Selectors
1. **Read the node module source**: `node_modules/@patternfly/chatbot/dist/esm/`
2. **Check component implementations**: Look for `className` properties  
3. **Use meaningful ARIA labels**: Better for accessibility testing
4. **Avoid guessing**: Always verify selectors exist in the actual component

## 📝 Component Test Examples

### ARHBadge (Simple Component)
```typescript
describe('ARHBadge Component', () => {
  it('should render with correct selectors', () => {
    cy.mount(<ARHBadge onClick={cy.stub()} />);
    
    // Specific image selector
    cy.get('img[alt="Launch Ask Red Hat assistant"]').should('exist');
    cy.get('img.arh__badge__image').should('exist');
    
    // PatternFly class validation
    cy.get('button').should('have.class', 'pf-v6-u-pt-sm');
  });
});
```

### ARHBanner (With Context)
```typescript
describe('ARHBanner Component', () => {
  it('should handle user interactions', () => {
    const mockSetOpen = cy.stub();
    
    cy.mount(
      <TestWrapper>
        <ARHBanner isOpen={true} setOpen={mockSetOpen} variant="privacy" />
      </TestWrapper>
    );
    
    // PatternFly Alert selectors
    cy.get('.pf-v6-c-alert').should('exist');
    cy.get('.pf-v6-c-alert__action button').click();
    
    // Verify interaction
    cy.wrap(mockSetOpen).should('have.been.calledWith', false);
  });
});
```

## 🔧 Configuration Files

### Cypress Configuration
- `cypress.config.ts`: Main Cypress configuration
- `config/webpack.cy.config.js`: Webpack setup for component tests (no aliasing needed)
- `cypress/support/component.ts`: Component test support

### Key Configuration Notes
- **No webpack aliasing needed** for ARH tests (uses real context)
- Jest mocks are in `src/__mocks__/` (auto-loaded)
- Cypress tests use `TestWrapper` pattern with real `AIStateContext`

## 🚀 Running Tests

### All Tests
```bash
npm run cypress:run:cp        # All Cypress component tests
npm test                      # All Jest tests
```

### Specific Tests
```bash
# Cypress
npx cypress run --component --spec "cypress/components/ARH*.cy.tsx"
npx cypress run --component --spec "cypress/components/ARHBanner.cy.tsx"

# Jest  
npm test useScrollToBottom
npm test -- --watch
```

### Development Mode
```bash
npx cypress open              # Interactive Cypress
npm run test:watch            # Jest watch mode
```

## ✅ Test Coverage Results

### Jest Tests: 6/6 passing
- **useScrollToBottom hook**: Complete coverage including edge cases
- **UserMessageEntry component**: Basic rendering test (uses mocked PatternFly virtual-assistant)

### Cypress Tests: 27/27 passing
- **ARHBadge**: 5/5 - Badge with tooltip and accessibility
- **ARHBanner**: 9/9 - Privacy/read-only banners with full interactions  
- **ARHChatbot**: 3/3 - Main chatbot container with proper selectors
- **ARHFooter**: 3/3 - Message input and send functionality
- **ARHHeader**: 4/4 - Header with menu/close buttons using correct selectors
- **ARHMessages**: 3/3 - Message display with PatternFly components

## 🎯 Best Practices

### Selector Strategy
1. **Start specific**: Use PatternFly classes and ARIA labels
2. **Read the source**: Check `node_modules/@patternfly/chatbot/dist/esm/`
3. **Test functionality**: Validate actual behavior, not just rendering
4. **Avoid generic selectors**: Never use `body`, prefer component-specific selectors

### Mock Strategy  
1. **Use real contexts**: Don't create custom mock contexts
2. **Mock at boundaries**: Mock external dependencies, use real internal components
3. **Provide complete interfaces**: Ensure mocks match expected function signatures
4. **Keep tests isolated**: Each test should be independent

### Maintenance
1. **Update selectors when PatternFly updates**: Check for breaking changes
2. **Keep mocks minimal**: Only mock what's necessary
3. **Document selector sources**: Note where selectors come from in comments
4. **Test in isolation**: Avoid integration testing in component tests

## 🔍 Troubleshooting

### Common Issues
1. **"AIStateContext not initialized"**: Use `TestWrapper` with real context
2. **"Element not found"**: Verify selector in PatternFly source code  
3. **Jest mocks not working**: Check `src/__mocks__/` file structure
4. **Webpack errors**: Remove webpack aliasing for ai-react-state
5. **"Cannot use import statement outside a module"**: Add problematic packages to `transformIgnorePatterns` in `jest.config.js`
6. **"(0, _jss.create) is not a function"**: Mock the problematic package in `src/__mocks__/`

### Debugging Tips
1. **Use Cypress headed mode**: `--headed` flag for visual debugging
2. **Check network calls**: Ensure no real API calls in tests
3. **Verify PatternFly versions**: Selectors may change between versions
4. **Use meaningful test descriptions**: Help identify failing scenarios

---

This guide provides everything needed to maintain and extend the ARH chatbot test suite. Always prioritize proper selectors and realistic mocking for maintainable, reliable tests.