import React from 'react';
import ARHBadge from '../../src/Components/ARHClient/ARHBadge';

describe('ARHBadge Component', () => {
  it('should render the badge with tooltip', () => {
    const mockOnClick = cy.stub();
    
    cy.mount(<ARHBadge onClick={mockOnClick} />);
    
    // Should render the button
    cy.get('button').should('exist');
    
    // Should have the correct image
    cy.get('img[alt="Launch Ask Red Hat assistant"]').should('exist');
    cy.get('img.astro__badge').should('exist');
  });

  it('should show tooltip on hover', () => {
    const mockOnClick = cy.stub();
    
    cy.mount(<ARHBadge onClick={mockOnClick} />);
    
    // Hover over the button to show tooltip
    cy.get('button').trigger('mouseenter');
    
    // Tooltip content should appear
    cy.contains('Ask Red Hat').should('be.visible');
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = cy.stub().as('onClick');
    
    cy.mount(<ARHBadge onClick={mockOnClick} />);
    
    // Click the button
    cy.get('button').click();
    
    // Verify onClick was called
    cy.get('@onClick').should('have.been.called');
  });

  it('should have correct accessibility attributes', () => {
    const mockOnClick = cy.stub();
    
    cy.mount(<ARHBadge onClick={mockOnClick} />);
    
    // Button should be accessible
    cy.get('button').should('have.attr', 'type', 'button');
    
    // Image should have alt text
    cy.get('img').should('have.attr', 'alt', 'Launch Ask Red Hat assistant');
  });

  it('should have correct CSS classes', () => {
    const mockOnClick = cy.stub();
    
    cy.mount(<ARHBadge onClick={mockOnClick} />);
    
    // Button should have PatternFly classes
    cy.get('button').should('have.class', 'pf-v6-u-pt-sm');
    
    // Image should have astro class
    cy.get('img').should('have.class', 'astro__badge');
  });
});