import { useMemo, useState, useEffect } from 'react';
import { ClientAuthStatus, Models, StateManagerConfiguration, WelcomeConfig } from './types';
import VAClient from './vaClient';
import { createClientStateManager, Events } from '@redhat-cloud-services/ai-client-state';
import VAMessageEntry from '../Components/VAClient/VAMessageEntry';

const DEFAULT_WELCOME_CONTENT = 'Welcome to the Virtual Assistant! I can help you navigate the Hybrid Cloud Console, update your personal information, request access from your admin, show critical vulnerabilities, get Advisor recommendations, and more.';
export function useVaAuthenticated(): ClientAuthStatus {
  // VA does not have restrictions
  return {
    loading: false,
    isAuthenticated: true,
    model: Models.VA,
  };
}

export default function useVaManager(): StateManagerConfiguration<VAClient> {
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeConfig | undefined>(undefined);

  const stateManager = useMemo(() => {
    const client = new VAClient();
    const stateManager = createClientStateManager(client);
    return stateManager;
  }, []);

  // Watch for client initialization to update welcome content using state manager events
  useEffect(() => {
    const client = stateManager.getClient();
    
    const updateContent = () => {
      console.log('VA Manager - updateContent called, client initialized:', client.isInitialized(), 'initializing:', client.isInitializing());
      
      if (client.isInitialized()) {
        const dynamicContent = client.getWelcomeConfig();
        console.log('VA Manager - dynamic content:', dynamicContent);
        
        if (dynamicContent && dynamicContent.content) {
          setWelcomeConfig(dynamicContent);
        } else {
          // Fallback to default content if dynamic content is empty
          const defaultContent = {content: 'Welcome to the Virtual Assistant! I can help you navigate the Hybrid Cloud Console, update your personal information, request access from your admin, show critical vulnerabilities, get Advisor recommendations, and more.'};
          setWelcomeConfig(defaultContent);
        }
      } else if (!client.isInitializing()) {
        // Not initialized and not initializing - show default content
        const defaultContent = {content: 'Welcome to the Virtual Assistant! I can help you navigate the Hybrid Cloud Console, update your personal information, request access from your admin, show critical vulnerabilities, get Advisor recommendations, and more.'};
        setWelcomeConfig(defaultContent);
      }
    };
    
    // Check immediately
    updateContent();
    
    // Subscribe to state manager events for updates
    const unsubscribeInit = stateManager.subscribe(Events.INITIALIZING_MESSAGES, updateContent);
    const unsubscribeConversation = stateManager.subscribe(Events.ACTIVE_CONVERSATION, updateContent);
    
    return () => {
      unsubscribeInit();
      unsubscribeConversation();
    };
  }, [stateManager]);

  return {
    stateManager,
    model: Models.VA,
    historyManagement: false,
    docsUrl:
      'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/getting_started_with_the_red_hat_hybrid_cloud_console/hcc-help-options_getting-started#virtual-assistant_getting-started',
    streamMessages: false,
    modelName: 'Virtual Assistant',
    selectionTitle: 'Hybrid Cloud Core console',
    selectionDescription:
      'Update your personal information, request access from your admin, show critical vulnerabilities, get Advisor recommendations, and more.',
    MessageEntryComponent: VAMessageEntry,
    welcome: welcomeConfig
  };
}
