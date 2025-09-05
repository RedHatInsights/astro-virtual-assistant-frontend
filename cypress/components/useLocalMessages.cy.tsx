import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSystemMessages, useBannerMessages } from '../../src/Components/VAClient/useLocalMessages';

// Note: These are hook tests that verify the behavior of the message management hooks
// Since these are React hooks, we use @testing-library/react for testing instead of Cypress mounting

describe('useSystemMessages Hook', () => {
  it('should initialize with empty system messages', () => {
    const TestComponent = () => {
      const { systemMessages } = useSystemMessages();
      return (
        <div data-testid="system-messages">
          {JSON.stringify(systemMessages)}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    cy.get('[data-testid="system-messages"]').should('contain', '[]');
  });

  it('should add system messages correctly', () => {
    const TestComponent = () => {
      const { systemMessages, addSystemMessage } = useSystemMessages();
      
      React.useEffect(() => {
        // Add a system message on mount
        addSystemMessage('user_not_found', ['test-user']);
      }, []);
      
      return (
        <div data-testid="system-messages">
          <div data-testid="message-count">{systemMessages.length}</div>
          {systemMessages.map((msg, index) => (
            <div key={index} data-testid={`message-${index}`}>
              <span data-testid={`type-${index}`}>{msg.type}</span>
              <span data-testid={`content-${index}`}>{msg.content}</span>
              <span data-testid={`from-${index}`}>{msg.from}</span>
              <span data-testid={`additional-${index}`}>{JSON.stringify(msg.additionalContent)}</span>
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Should have one message
    cy.get('[data-testid="message-count"]').should('contain', '1');
    
    // Should have correct message properties
    cy.get('[data-testid="type-0"]').should('contain', 'user_not_found');
    cy.get('[data-testid="content-0"]').should('contain', 'system_message');
    cy.get('[data-testid="from-0"]').should('contain', 'system');
    cy.get('[data-testid="additional-0"]').should('contain', '["test-user"]');
  });

  it('should add multiple system messages', () => {
    const TestComponent = () => {
      const { systemMessages, addSystemMessage } = useSystemMessages();
      const [messageCount, setMessageCount] = React.useState(0);
      
      const addMessage = () => {
        addSystemMessage(`message_${messageCount}`, [`content-${messageCount}`]);
        setMessageCount(prev => prev + 1);
      };
      
      return (
        <div data-testid="system-messages">
          <button data-testid="add-message" onClick={addMessage}>
            Add Message
          </button>
          <div data-testid="message-count">{systemMessages.length}</div>
          {systemMessages.map((msg, index) => (
            <div key={index} data-testid={`message-${index}-type`}>
              {msg.type}
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Initially no messages
    cy.get('[data-testid="message-count"]').should('contain', '0');
    
    // Add first message
    cy.get('[data-testid="add-message"]').click();
    cy.get('[data-testid="message-count"]').should('contain', '1');
    cy.get('[data-testid="message-0-type"]').should('contain', 'message_0');
    
    // Add second message
    cy.get('[data-testid="add-message"]').click();
    cy.get('[data-testid="message-count"]').should('contain', '2');
    cy.get('[data-testid="message-1-type"]').should('contain', 'message_1');
  });

  it('should handle system messages without additional content', () => {
    const TestComponent = () => {
      const { systemMessages, addSystemMessage } = useSystemMessages();
      
      React.useEffect(() => {
        addSystemMessage('simple_message');
      }, []);
      
      return (
        <div data-testid="system-messages">
          {systemMessages.map((msg, index) => (
            <div key={index} data-testid={`message-${index}`}>
              <span data-testid={`additional-${index}`}>{JSON.stringify(msg.additionalContent)}</span>
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Should have empty array for additional content
    cy.get('[data-testid="additional-0"]').should('contain', '[]');
  });
});

describe('useBannerMessages Hook', () => {
  it('should initialize with empty banner messages', () => {
    const TestComponent = () => {
      const { bannerMessages } = useBannerMessages();
      return (
        <div data-testid="banner-messages">
          {JSON.stringify(bannerMessages)}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    cy.get('[data-testid="banner-messages"]').should('contain', '[]');
  });

  it('should add banner messages correctly', () => {
    const TestComponent = () => {
      const { bannerMessages, addBanner } = useBannerMessages();
      
      React.useEffect(() => {
        // Add a banner message on mount
        addBanner('create_service_account', ['test-account', 'Test description', 'client-123', 'secret-456']);
      }, []);
      
      return (
        <div data-testid="banner-messages">
          <div data-testid="message-count">{bannerMessages.length}</div>
          {bannerMessages.map((msg, index) => (
            <div key={index} data-testid={`banner-${index}`}>
              <span data-testid={`type-${index}`}>{msg.type}</span>
              <span data-testid={`content-${index}`}>{msg.content}</span>
              <span data-testid={`from-${index}`}>{msg.from}</span>
              <span data-testid={`additional-${index}`}>{JSON.stringify(msg.additionalContent)}</span>
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Should have one message
    cy.get('[data-testid="message-count"]').should('contain', '1');
    
    // Should have correct message properties
    cy.get('[data-testid="type-0"]').should('contain', 'create_service_account');
    cy.get('[data-testid="content-0"]').should('contain', 'banner');
    cy.get('[data-testid="from-0"]').should('contain', 'interface');
    cy.get('[data-testid="additional-0"]').should('contain', '["test-account","Test description","client-123","secret-456"]');
  });

  it('should add multiple banner messages', () => {
    const TestComponent = () => {
      const { bannerMessages, addBanner } = useBannerMessages();
      const [messageCount, setMessageCount] = React.useState(0);
      
      const addMessage = () => {
        addBanner(`banner_${messageCount}`, [`content-${messageCount}`]);
        setMessageCount(prev => prev + 1);
      };
      
      return (
        <div data-testid="banner-messages">
          <button data-testid="add-banner" onClick={addMessage}>
            Add Banner
          </button>
          <div data-testid="message-count">{bannerMessages.length}</div>
          {bannerMessages.map((msg, index) => (
            <div key={index} data-testid={`banner-${index}-type`}>
              {msg.type}
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Initially no messages
    cy.get('[data-testid="message-count"]').should('contain', '0');
    
    // Add first banner
    cy.get('[data-testid="add-banner"]').click();
    cy.get('[data-testid="message-count"]').should('contain', '1');
    cy.get('[data-testid="banner-0-type"]').should('contain', 'banner_0');
    
    // Add second banner
    cy.get('[data-testid="add-banner"]').click();
    cy.get('[data-testid="message-count"]').should('contain', '2');
    cy.get('[data-testid="banner-1-type"]').should('contain', 'banner_1');
  });

  it('should handle banner messages without additional content', () => {
    const TestComponent = () => {
      const { bannerMessages, addBanner } = useBannerMessages();
      
      React.useEffect(() => {
        addBanner('simple_banner');
      }, []);
      
      return (
        <div data-testid="banner-messages">
          {bannerMessages.map((msg, index) => (
            <div key={index} data-testid={`banner-${index}`}>
              <span data-testid={`additional-${index}`}>{JSON.stringify(msg.additionalContent)}</span>
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Should have empty array for additional content
    cy.get('[data-testid="additional-0"]').should('contain', '[]');
  });

  it('should properly set createdAt timestamps', () => {
    const TestComponent = () => {
      const { bannerMessages, addBanner } = useBannerMessages();
      
      const addBannerWithTime = () => {
        addBanner('test_banner');
      };
      
      return (
        <div data-testid="banner-messages">
          <button data-testid="add-banner" onClick={addBannerWithTime}>
            Add Banner
          </button>
          {bannerMessages.map((msg, index) => (
            <div key={index} data-testid={`banner-${index}`}>
              <span data-testid={`created-${index}`}>{msg.createdAt}</span>
              <span data-testid={`has-timestamp-${index}`}>
                {typeof msg.createdAt === 'number' && msg.createdAt > 0 ? 'valid' : 'invalid'}
              </span>
            </div>
          ))}
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Add a banner
    cy.get('[data-testid="add-banner"]').click();
    
    // Should have a valid timestamp
    cy.get('[data-testid="has-timestamp-0"]').should('contain', 'valid');
    cy.get('[data-testid="created-0"]').should('not.be.empty');
  });
});

describe('Combined Hook Usage', () => {
  it('should work together for system and banner messages', () => {
    const TestComponent = () => {
      const { systemMessages, addSystemMessage } = useSystemMessages();
      const { bannerMessages, addBanner } = useBannerMessages();
      
      const addSystemMsg = () => {
        addSystemMessage('test_system', ['system_content']);
      };
      
      const addBannerMsg = () => {
        addBanner('test_banner', ['banner_content']);
      };
      
      return (
        <div data-testid="combined-messages">
          <button data-testid="add-system" onClick={addSystemMsg}>
            Add System
          </button>
          <button data-testid="add-banner" onClick={addBannerMsg}>
            Add Banner
          </button>
          <div data-testid="system-count">{systemMessages.length}</div>
          <div data-testid="banner-count">{bannerMessages.length}</div>
          <div data-testid="total-count">{systemMessages.length + bannerMessages.length}</div>
        </div>
      );
    };

    cy.mount(<TestComponent />);
    
    // Initially no messages
    cy.get('[data-testid="system-count"]').should('contain', '0');
    cy.get('[data-testid="banner-count"]').should('contain', '0');
    cy.get('[data-testid="total-count"]').should('contain', '0');
    
    // Add system message
    cy.get('[data-testid="add-system"]').click();
    cy.get('[data-testid="system-count"]').should('contain', '1');
    cy.get('[data-testid="banner-count"]').should('contain', '0');
    cy.get('[data-testid="total-count"]').should('contain', '1');
    
    // Add banner message
    cy.get('[data-testid="add-banner"]').click();
    cy.get('[data-testid="system-count"]').should('contain', '1');
    cy.get('[data-testid="banner-count"]').should('contain', '1');
    cy.get('[data-testid="total-count"]').should('contain', '2');
  });
});