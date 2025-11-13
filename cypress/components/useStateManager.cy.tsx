import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import useStateManager from '../../src/aiClients/useStateManager';
import { VirtualAssistantStateSingleton, Models } from '../../src/utils/VirtualAssistantStateSingleton';

// Extend window interface for mock data
declare global {
  interface Window {
    cypressMockData: {
      hookResults: Array<Record<string, unknown>>;
    };
  }
}

// Helper to set mock hook results
const setMockHookResults = (results: Array<Record<string, unknown>>) => {
  if (!window.cypressMockData) {
    window.cypressMockData = { hookResults: [] };
  }
  window.cypressMockData.hookResults = results;
};

// Create a mock state manager factory
const createStateManager = () => ({
  isInitialized: () => false,
  isInitializing: () => false,
  init: cy.stub(),
  destroy: cy.stub(),
});

// Test wrapper component that uses the useStateManager hook
const UseStateManagerComponent = ({ isOpen = true }: { isOpen?: boolean }) => {
  const { managers, currentModel, setCurrentModel } = useStateManager(isOpen);

  return (
    <div>
      <div data-testid="use-state-manager">UseStateManager Component Mounted</div>
      <div data-testid="current-model">{currentModel || 'undefined'}</div>
      <div data-testid="managers-count">{managers?.length || 0}</div>
      {managers && (
        <ul data-testid="managers-list">
          {managers.map((manager, index) => (
            <li key={index} data-testid={`manager-${manager.model}`}>
              {manager.model}
            </li>
          ))}
        </ul>
      )}
      <button data-testid="set-model-btn" onClick={() => setCurrentModel(Models.ASK_RED_HAT)}>
        Set Model
      </button>
    </div>
  );
};

describe('useStateManager Model Selection Tests', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    VirtualAssistantStateSingleton.setIsOpen(false);
    VirtualAssistantStateSingleton.setCurrentModel(undefined);
    
    // Set up default managers (ARH and RHEL)
    const defaultManagers = [
      {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: Models.ASK_RED_HAT,
            modelName: 'Ask Red Hat',
            selectionTitle: 'General Red Hat (Default)',
            selectionDescription: 'Ask Red Hat',
            stateManager: createStateManager(),
            historyManagement: true,
            streamMessages: true,
            docsUrl: '',
            routes: ['/insights/*'],
          },
        },
      },
      {
        id: 'rhel',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: Models.RHEL_LIGHTSPEED,
            modelName: 'RHEL Lightspeed',
            selectionTitle: 'RHEL Lightspeed',
            selectionDescription: 'RHEL-specific assistance',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            docsUrl: '',
            routes: ['/rhel/*'],
          },
        },
      }
    ];
    
    setMockHookResults(defaultManagers);
  });

  it('should auto-correct when currentModel does not exist in managers', () => {
    // Set current model to one that doesn't exist in managers
    VirtualAssistantStateSingleton.setCurrentModel(Models.VA);

    cy.mount(
      <BrowserRouter>
        <UseStateManagerComponent isOpen={true} />
      </BrowserRouter>
    );

    // Verify component mounted
    cy.get('[data-testid="use-state-manager"]').should('exist');

    // Wait for managers to load
    cy.get('[data-testid="managers-count"]').should('contain', '2');

    // Verify managers are loaded correctly
    cy.get('[data-testid="manager-Ask Red Hat"]').should('exist');
    cy.get('[data-testid="manager-RHEL Lightspeed"]').should('exist');

    // The hook should auto-correct to the first available manager's model
    cy.get('[data-testid="current-model"]').should('contain', Models.ASK_RED_HAT);

    // Verify the singleton was updated
    cy.wrap(null).then(() => {
      expect(VirtualAssistantStateSingleton.getInstance().currentModel).to.equal(Models.ASK_RED_HAT);
    });
  });

  it('should keep currentModel when it exists in managers', () => {
    // Set current model to RHEL Lightspeed which exists in managers
    VirtualAssistantStateSingleton.setCurrentModel(Models.RHEL_LIGHTSPEED);

    cy.mount(
      <BrowserRouter>
        <UseStateManagerComponent isOpen={true} />
      </BrowserRouter>
    );

    // Verify component mounted
    cy.get('[data-testid="use-state-manager"]').should('exist');

    // Wait for managers to load
    cy.get('[data-testid="managers-count"]').should('contain', '2');

    // Verify managers are loaded correctly
    cy.get('[data-testid="manager-Ask Red Hat"]').should('exist');
    cy.get('[data-testid="manager-RHEL Lightspeed"]').should('exist');

    // The hook should keep the current model since it exists in managers
    cy.get('[data-testid="current-model"]').should('contain', Models.RHEL_LIGHTSPEED);

    // Verify the singleton still has the correct model
    cy.wrap(null).then(() => {
      expect(VirtualAssistantStateSingleton.getInstance().currentModel).to.equal(Models.RHEL_LIGHTSPEED);
    });
  });

  it('should auto-correct when currentModel is undefined', () => {
    // Don't set any current model (remains undefined)
    VirtualAssistantStateSingleton.setCurrentModel(undefined);

    cy.mount(
      <BrowserRouter>
        <UseStateManagerComponent isOpen={true} />
      </BrowserRouter>
    );

    // Verify component mounted
    cy.get('[data-testid="use-state-manager"]').should('exist');

    // Wait for managers to load
    cy.get('[data-testid="managers-count"]').should('contain', '2');

    // The hook should set to the first available manager's model
    cy.get('[data-testid="current-model"]').should('contain', Models.ASK_RED_HAT);

    // Verify the singleton was updated
    cy.wrap(null).then(() => {
      expect(VirtualAssistantStateSingleton.getInstance().currentModel).to.equal(Models.ASK_RED_HAT);
    });
  });

  it('should handle single manager scenario', () => {
    // Set current model to one that doesn't exist
    VirtualAssistantStateSingleton.setCurrentModel(Models.VA);

    // Set up only one manager
    setMockHookResults([{
      id: 'arh',
      loading: false,
      error: null,
      hookResult: {
        manager: {
          model: Models.ASK_RED_HAT,
          modelName: 'Ask Red Hat',
          selectionTitle: 'General Red Hat (Default)',
          selectionDescription: 'Ask Red Hat',
          stateManager: createStateManager(),
          historyManagement: true,
          streamMessages: true,
          docsUrl: '',
          routes: ['/insights/*'],
        },
      },
    }]);

    cy.mount(
      <BrowserRouter>
        <UseStateManagerComponent isOpen={true} />
      </BrowserRouter>
    );

    // Verify component mounted
    cy.get('[data-testid="use-state-manager"]').should('exist');

    // Wait for managers to load (only 1 manager)
    cy.get('[data-testid="managers-count"]').should('contain', '1');

    // Should auto-correct to the only available manager
    cy.get('[data-testid="current-model"]').should('contain', Models.ASK_RED_HAT);

    // Verify the singleton was updated
    cy.wrap(null).then(() => {
      expect(VirtualAssistantStateSingleton.getInstance().currentModel).to.equal(Models.ASK_RED_HAT);
    });
  });

  it('should not change model when managers list is empty', () => {
    // Set a current model
    VirtualAssistantStateSingleton.setCurrentModel(Models.ASK_RED_HAT);

    // Set empty managers list
    setMockHookResults([]);

    cy.mount(
      <BrowserRouter>
        <UseStateManagerComponent isOpen={true} />
      </BrowserRouter>
    );

    // Verify component mounted
    cy.get('[data-testid="use-state-manager"]').should('exist');

    // No managers loaded
    cy.get('[data-testid="managers-count"]').should('contain', '0');

    // Current model should remain unchanged (the hook returns early when no managers)
    cy.get('[data-testid="current-model"]').should('contain', Models.ASK_RED_HAT);
  });
});

