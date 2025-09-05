import React from 'react';
import BannerEntry from '../../src/Components/VAClient/BannerMessage';
import { Banner } from '../../src/types/Message';

describe('BannerMessage Component - Banner Types', () => {
  describe('Conversation End Banner', () => {
    it('should render conversation end banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'finish_conversation_banner'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with info variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-info');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-inline');
      
      // Should display correct message
      cy.contains('You can start a new conversation at any time by typing below.').should('be.visible');
    });
  });

  describe('Service Account Creation Banners', () => {
    it('should render successful service account creation banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'create_service_account',
        additionalContent: [
          'test-service-account',
          'This is a test service account description',
          'client-id-123',
          'secret-key-456'
        ]
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with success variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-success');
      
      // Should display success title
      cy.contains('Service account created successfully.').should('be.visible');
      
      // Should display service account name
      cy.contains('test-service-account').should('be.visible');
      
      // Should display description
      cy.contains('This is a test service account description').should('be.visible');
      
      // Should display client ID
      cy.contains('Client Id:').should('be.visible');
      cy.contains('client-id-123').should('be.visible');
      
      // Should display secret
      cy.contains('Secret:').should('be.visible');
      cy.contains('secret-key-456').should('be.visible');
      
      // Should display warning about storing credentials
      cy.contains('Please copy and store the').should('be.visible');
      cy.contains('Client Id').should('be.visible');
      cy.contains('Secret').should('be.visible');
      cy.contains('in a safe place').should('be.visible');
      cy.contains('These information will not be available to you again.').should('be.visible');
    });

    it('should render service account creation failed banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'create_service_account_failed'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with danger variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-danger');
      
      // Should display failure title
      cy.contains('Service account creation failed.').should('be.visible');
      
      // Should display error message
      cy.contains('There maybe some ongoing issue with the internal API').should('be.visible');
      cy.contains('Please try again later.').should('be.visible');
    });

    it('should handle service account banner without additional content', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'create_service_account'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should not render anything when no additional content
      cy.get('.pf-v6-c-alert').should('not.exist');
    });
  });

  describe('Two-Factor Authentication Banners', () => {
    it('should render 2FA enable success banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa',
        additionalContent: ['true']
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with success variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-success');
      
      // Should display success title for enabling
      cy.contains('Two-factor authentication enabled successfully').should('be.visible');
      
      // Should display enable-specific messages
      cy.contains('Two-factor authentication has been enabled successfully.').should('be.visible');
      cy.contains('Users will be required to set up two-factor authentication').should('be.visible');
      cy.contains('the next time they attempt to log in.').should('be.visible');
      
      // Should display help information
      cy.contains('They can chat with me if they need help').should('be.visible');
      cy.contains('setting up two-factor authentication').should('be.visible');
      
      // Should have link to documentation
      cy.get('a[href*="two-factor_authentication"]').should('exist');
      cy.get('a[href*="two-factor_authentication"]').should('have.attr', 'target', '_blank');
      cy.get('a[href*="two-factor_authentication"]').should('have.attr', 'rel', 'noopener noreferrer');
      cy.contains('our documentation').should('be.visible');
    });

    it('should render 2FA disable success banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa',
        additionalContent: ['false']
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with success variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-success');
      
      // Should display success title for disabling
      cy.contains('Two-factor authentication disabled successfully').should('be.visible');
      
      // Should display disable-specific message
      cy.contains('The two-factor authentication requirement has been removed successfully.').should('be.visible');
      
      // Should not display enable-specific messages
      cy.contains('Users will be required to set up').should('not.exist');
      cy.contains('They can chat with me').should('not.exist');
    });

    it('should render 2FA enable failed banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa_failed',
        additionalContent: ['true']
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with danger variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-danger');
      
      // Should display failure title
      cy.contains('Operation failed.').should('be.visible');
      
      // Should display enable-specific error message
      cy.contains('You may not have adequate permission to enable two-factor authentication.').should('be.visible');
    });

    it('should render 2FA disable failed banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa_failed',
        additionalContent: ['false']
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with danger variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-danger');
      
      // Should display failure title
      cy.contains('Operation failed.').should('be.visible');
      
      // Should display disable-specific error message
      cy.contains('You may not have adequate permission to disable two-factor authentication.').should('be.visible');
    });

    it('should handle 2FA banners without additional content', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should not render anything when no additional content
      cy.get('.pf-v6-c-alert').should('not.exist');
    });
  });

  describe('General Error Banners', () => {
    it('should render message too long banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'message_too_long'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with info variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-info');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-inline');
      
      // Should display message length limit
      cy.contains('Your message cannot exceed 2048 characters.').should('be.visible');
    });

    it('should render request error banner', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'request_error'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render PatternFly Alert with danger variant
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-danger');
      
      // Should display generic error message
      cy.contains('Sorry, something went wrong while talking to the Virtual Assistant.').should('be.visible');
    });
  });

  describe('Unknown Banner Types', () => {
    it('should handle unknown banner types gracefully', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'unknown_banner_type' as any
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should not render anything for unknown banner types
      cy.get('.pf-v6-c-alert').should('not.exist');
      cy.get('body').should('not.contain', 'unknown_banner_type');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for alerts', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'finish_conversation_banner'
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should render alert with proper classes and structure
      cy.get('.pf-v6-c-alert').should('exist');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-info');
      cy.get('.pf-v6-c-alert').should('have.class', 'pf-m-inline');
      
      // Should have accessible content
      cy.contains('You can start a new conversation at any time by typing below.').should('be.visible');
    });

    it('should have proper link accessibility for external documentation', () => {
      const banner: Banner = {
        from: 'interface' as any,
        content: 'banner',
        type: 'toggle_org_2fa',
        additionalContent: ['true']
      };

      cy.mount(<BannerEntry message={banner} />);

      // Should have proper link attributes for accessibility
      cy.get('a[href*="two-factor_authentication"]')
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer');
    });
  });
});
