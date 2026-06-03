import React from 'react';
import UniversalBadge from '../../src/Components/UniversalChatbot/UniversalBadge';

describe('UniversalBadge Component', () => {
  it('should render the badge with tooltip', () => {
    const mockOnClick = cy.stub();

    cy.mount(<UniversalBadge onClick={mockOnClick} />);

    // Should render the button with aria-label
    cy.get('button[aria-label="Launch AI assistant"]').should('exist');

    // Should have the image
    cy.get('img.arh__badge__image').should('exist');
  });

  it('should show tooltip on hover', () => {
    const mockOnClick = cy.stub();
    
    cy.mount(<UniversalBadge onClick={mockOnClick} />);
    
    // Hover over the button to show tooltip
    cy.get('button').trigger('mouseenter');
    
    // Tooltip content should appear
    cy.contains('AI assistants').should('be.visible');
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = cy.stub().as('onClick');
    
    cy.mount(<UniversalBadge onClick={mockOnClick} />);
    
    // Click the button
    cy.get('button').click();
    
    // Verify onClick was called
    cy.get('@onClick').should('have.been.called');
  });

  it('should have correct accessibility attributes', () => {
    const mockOnClick = cy.stub();

    cy.mount(<UniversalBadge onClick={mockOnClick} />);

    // Button should be accessible with aria-label
    cy.get('button').should('have.attr', 'type', 'button');
    cy.get('button').should('have.attr', 'aria-label', 'Launch AI assistant');

    // Image should have empty alt (decorative, button provides label)
    cy.get('img').should('have.attr', 'alt', '');
  });
});