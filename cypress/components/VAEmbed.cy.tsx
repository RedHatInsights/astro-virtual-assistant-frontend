import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Panel, PanelMain } from '@patternfly/react-core';
import VAEmbed from '../../src/SharedComponents/VAEmbed/VAEmbed';
import { Models } from '../../src/aiClients/types';
import VAClient from '../../src/aiClients/vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';

// Extend window interface for mock data (used by cypress/mocks/scalprum-react-core.js)
declare global {
  interface Window {
    cypressMockData: {
      hookResults: Array<Record<string, unknown>>;
    };
  }
}

// Mock Chrome API
const mockChromeApi = {
  auth: {
    getToken: () => Promise.resolve('mock-token'),
    getUser: () => Promise.resolve({
      identity: {
        user: {
          username: 'testuser',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          is_internal: false,
          is_active: true,
          is_org_admin: true,
          locale: 'en-US'
        },
        account_number: '123456',
        internal: {
          account_id: '123456'
        },
        org_id: 'test-org',
        type: 'User'
      },
      entitlements: {}
    }),
  },
  getEnvironment: () => 'stage',
  isBeta: () => false,
};

// Setup mock managers for VAEmbed's useStateManager hook
const setupMockManagers = () => {
  const vaClient = new VAClient();
  const stateManager = createClientStateManager(vaClient);

  const mockManagers = [{
    id: 'va',
    loading: false,
    error: null,
    hookResult: {
      manager: {
        model: Models.VA,
        modelName: 'Virtual Assistant',
        stateManager,
        historyManagement: false,
        streamMessages: false,
        docsUrl: '',
        selectionTitle: 'Virtual Assistant',
        selectionDescription: 'Test VA',
      },
    },
  }];

  if (!window.cypressMockData) {
    window.cypressMockData = { hookResults: [] };
  }
  window.cypressMockData.hookResults = mockManagers;

  // Add Chrome API to window for VA client
  (window as any).chrome = mockChromeApi;
};

// Test wrapper that provides Router context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Simple component that embeds real VAEmbed
const HelpPanelWithEmbed = () => (
  <Panel data-testid="help-panel">
    <PanelMain>
      <h2>Help Panel</h2>
      <VAEmbed className="test-embed" />
    </PanelMain>
  </Panel>
);

describe('VAEmbed Component', () => {
  beforeEach(() => {
    // Setup mock managers and Chrome API for useStateManager
    setupMockManagers();
  });

  it('should render embedded in a help panel', () => {
    // Suppress Chrome API errors for this test
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('getUser')) {
        return false;
      }
    });

    cy.mount(
      <TestWrapper>
        <HelpPanelWithEmbed />
      </TestWrapper>
    );

    // Verify help panel exists
    cy.get('[data-testid="help-panel"]').should('exist');
    cy.contains('Help Panel').should('be.visible');

    // Verify VAEmbed component is embedded inline
    cy.get('.va-embed').should('exist');
    cy.get('.test-embed').should('exist');

    // Should be within the help panel (not portal)
    cy.get('[data-testid="help-panel"]').within(() => {
      cy.get('.va-embed').should('exist');
    });

    // Verify we can see chatbot elements
    cy.get('#ai-chatbot').should('exist');
  });

  it('should render with custom className', () => {
    cy.mount(
      <TestWrapper>
        <div data-testid="custom-container">
          <VAEmbed className="custom-style" />
        </div>
      </TestWrapper>
    );

    // Verify VAEmbed renders with correct classes
    cy.get('.va-embed').should('exist');
    cy.get('.custom-style').should('exist');
    cy.get('.va-embed.custom-style').should('exist');

    // Should contain chatbot
    cy.get('#ai-chatbot').should('exist');
  });

  it('should render inline without portal behavior', () => {
    cy.mount(
      <TestWrapper>
        <div data-testid="parent-wrapper">
          <h1>Page Title</h1>
          <div data-testid="embed-container">
            <VAEmbed className="inline-embed" />
          </div>
          <footer>Footer Content</footer>
        </div>
      </TestWrapper>
    );

    // Verify embedded component is within normal DOM flow
    cy.get('[data-testid="parent-wrapper"]').within(() => {
      cy.contains('Page Title').should('exist');
      cy.get('[data-testid="embed-container"]').should('exist');
      cy.contains('Footer Content').should('exist');
    });

    // VAEmbed should be within the embed container, not portaled
    cy.get('[data-testid="embed-container"]').within(() => {
      cy.get('.va-embed').should('exist');
      cy.get('#ai-chatbot').should('exist');
    });

    // Verify it's rendered inline within the container, not as a portal
    // The key test is that it exists within embed-container AND also within parent-wrapper
    cy.get('[data-testid="parent-wrapper"]').within(() => {
      cy.get('.va-embed').should('exist');
    });
  });

  it('should fill the full height of a 600px container', () => {
    cy.mount(
      <TestWrapper>
        <div
          data-testid="height-test-container"
          style={{
            height: '600px',
            border: '3px solid blue',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <VAEmbed className="height-test-embed" />
        </div>
      </TestWrapper>
    );

    // Wait for component to render
    cy.get('.va-embed').should('exist');

    // Check .virtualAssistant wrapper height
    cy.get('.virtualAssistant').then(($wrapper) => {
      const wrapperHeight = $wrapper.height() || 0;
      const wrapperStyle = window.getComputedStyle($wrapper[0]);
      cy.log(`virtualAssistant wrapper height: ${wrapperHeight}px`);
      cy.log(`virtualAssistant computed height: ${wrapperStyle.height}`);
      cy.log(`virtualAssistant computed display: ${wrapperStyle.display}`);
    });

    // Get container height
    cy.get('[data-testid="height-test-container"]').then(($container) => {
      const containerHeight = $container.height() || 0;
      cy.log(`Container height: ${containerHeight}px`);

      // Deep dive into all elements and their computed styles
      cy.get('.virtualAssistant').then(($wrapper) => {
        const style = window.getComputedStyle($wrapper[0]);
        console.log(`[.virtualAssistant] height: ${$wrapper.height()}px, computed: ${style.height}, display: ${style.display}, flex: ${style.flex}, flexGrow: ${style.flexGrow}, flexDirection: ${style.flexDirection}`);
      });

      cy.get('.va-embed').then(($embed) => {
        const style = window.getComputedStyle($embed[0]);
        console.log(`[.va-embed] height: ${$embed.height()}px, computed: ${style.height}, display: ${style.display}, flex: ${style.flex}, flexGrow: ${style.flexGrow}`);
      });

      cy.get('.pf-chatbot').then(($chatbot) => {
        const style = window.getComputedStyle($chatbot[0]);
        console.log(`[.pf-chatbot] height: ${$chatbot.height()}px, computed: ${style.height}, minHeight: ${style.minHeight}, maxHeight: ${style.maxHeight}, display: ${style.display}, flex: ${style.flex}`);

        // Check all children of pf-chatbot for height constraints
        const children = $chatbot[0].children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const childStyle = window.getComputedStyle(child);
          console.log(`  Child ${i} [${child.className}]: height=${childStyle.height}, maxHeight=${childStyle.maxHeight}, flex=${childStyle.flex}, flexGrow=${childStyle.flexGrow}`);
        }
      });

      cy.get('#ai-chatbot').then(($ai) => {
        const style = window.getComputedStyle($ai[0]);
        console.log(`[#ai-chatbot] height: ${$ai.height()}px, computed: ${style.height}, display: ${style.display}, flex: ${style.flex}, flexGrow: ${style.flexGrow}`);
      });

      // Find the element that's actually 350px
      cy.get('.pf-chatbot').find('*').each(($el) => {
        const height = $el.height() || 0;
        if (height > 340 && height < 360) {
          const style = window.getComputedStyle($el[0]);
          console.log(`⚠️ FOUND 350px ELEMENT: ${$el[0].className || $el[0].tagName}`);
          console.log(`   height: ${style.height}, maxHeight: ${style.maxHeight}, overflow: ${style.overflow}, flex: ${style.flex}`);
        }
      });

      // Collect all debug info
      cy.get('.virtualAssistant').then(($wrapper) => {
        cy.get('.va-embed').then(($embed) => {
          cy.get('.pf-chatbot').then(($chatbot) => {
            const wrapperStyle = window.getComputedStyle($wrapper[0]);
            const embedStyle = window.getComputedStyle($embed[0]);
            const chatbotStyle = window.getComputedStyle($chatbot[0]);

            const embedHeight = $embed.height() || 0;

            const debugInfo = `
              Container: ${containerHeight}px
              .virtualAssistant: ${$wrapper.height()}px (computed: ${wrapperStyle.height}, flex: ${wrapperStyle.flex}, flexGrow: ${wrapperStyle.flexGrow})
              .va-embed: ${embedHeight}px (computed: ${embedStyle.height}, flex: ${embedStyle.flex}, flexGrow: ${embedStyle.flexGrow})
              .pf-chatbot: ${$chatbot.height()}px (computed: ${chatbotStyle.height}, minHeight: ${chatbotStyle.minHeight}, flex: ${chatbotStyle.flex})
            `;

            expect(embedHeight, `VAEmbed should fill container. Debug info: ${debugInfo}`).to.be.greaterThan(containerHeight - 20);
          });
        });
      });
    });
  });
});
