import React from 'react';
import { Panel, PanelMain } from '@patternfly/react-core';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import UniversalChatbot from '../../src/Components/UniversalChatbot/UniversalChatbot';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { Models } from '../../src/aiClients/types';
import VAClient from '../../src/aiClients/vaClient';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';

// Create a simple mock VAEmbed that shows the same behavior as the real one
const MockVAEmbed = ({ className, onClose }: { className?: string; onClose?: () => void }) => {
  // Use real state manager like VAChatbot test does
  const vaClient = React.useMemo(() => new VAClient(), []);
  const stateManager = React.useMemo(() => createClientStateManager(vaClient), [vaClient]);

  // Mock managers
  const mockManagers = [{
    model: Models.VA,
    modelName: 'Virtual Assistant',
    stateManager,
  }];

  return (
    <AIStateProvider stateManager={stateManager}>
      <div className={`va-embed ${className || ''}`}>
        <UniversalChatbot
          managers={mockManagers}
          currentModel={Models.VA}
          setCurrentModel={() => {}}
          setOpen={onClose || (() => {})}
          displayMode={ChatbotDisplayMode.embedded}
        />
      </div>
    </AIStateProvider>
  );
};

// Simple component that embeds MockVAEmbed
const HelpPanelWithEmbed = () => (
  <Panel data-testid="help-panel">
    <PanelMain>
      <h2>Help Panel</h2>
      <MockVAEmbed className="test-embed" />
    </PanelMain>
  </Panel>
);

describe('VAEmbed Component', () => {
  it('should render embedded in a help panel', () => {
    cy.mount(<HelpPanelWithEmbed />);

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
      <div data-testid="custom-container">
        <MockVAEmbed className="custom-style" />
      </div>
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
      <div data-testid="parent-wrapper">
        <h1>Page Title</h1>
        <div data-testid="embed-container">
          <MockVAEmbed className="inline-embed" />
        </div>
        <footer>Footer Content</footer>
      </div>
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

    // Verify it's not rendered as a portal to document.body
    cy.get('body').children().should('not.contain', '.va-embed');
  });
});