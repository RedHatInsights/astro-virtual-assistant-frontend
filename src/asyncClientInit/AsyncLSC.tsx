// experimental implementation of loading LSC state manager via scalprum modules
import React, { useEffect } from 'react';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { LightSpeedCoreAdditionalProperties, LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';

import { ClientAuthStatus, Models, StateManagerConfiguration } from '../aiClients/types';
import UniversalChatbot from '../Components/UniversalChatbot/UniversalChatbot';
import { AsyncStateManager } from './types';
import { ChatbotProps } from '../Components/UniversalChatbot/UniversalChatbotProvider';
import ARH_BOT_ICON from '../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { AsyncMessagePlaceholder } from '../Components/AsyncMessagePlaceholder/AsyncMessagePlaceholder';

type LightspeedMessage = ScalprumComponentProps<
  Record<string, unknown>,
  {
    message: MessageType<LightSpeedCoreAdditionalProperties>;
    avatar: string;
  }
>;

const LSCMessageEntry = ({ message, avatar }: { message: MessageType<LightSpeedCoreAdditionalProperties>; avatar: string }) => {
  const messageProps: LightspeedMessage = {
    message,
    avatar: message.role === 'user' ? avatar : ARH_BOT_ICON,
    scope: 'assistedInstallerApp',
    module: './ChatbotMessageEntry',
    fallback: null,
  };
  return <ScalprumComponent {...messageProps} fallback={<AsyncMessagePlaceholder />} />;
};

class AsyncLSC implements AsyncStateManager<IAIClient> {
  getStateManager(chrome: ChromeAPI): StateManagerConfiguration<LightspeedClient> {
    const client = new LightspeedClient({
      baseUrl: 'https://assisted-chat.api.stage.openshift.com',
      fetchFunction: async (input, init) => {
        const token = await chrome.auth.getToken();
        return fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });
    const stateManager = createClientStateManager(client);
    const config: StateManagerConfiguration<LightspeedClient> = {
      model: Models.OAI,
      stateManager,
      historyManagement: true,
      streamMessages: true,
      modelName: 'OpenShift assisted Installer',
      docsUrl: '#',
      selectionTitle: 'OpenShift assisted Installer',
      selectionDescription: 'TBD',
      MessageEntryComponent: LSCMessageEntry,
      handleNewChat: async (toggleDrawer) => {
        // can't use hooks here, we are not yet within the correct React context
        await stateManager.createNewConversation();
        toggleDrawer(false);
      },
    };

    return config;
  }
  async isAuthenticated(chrome: ChromeAPI): Promise<ClientAuthStatus> {
    const token = await chrome.auth.getToken();
    const authStatus: ClientAuthStatus = {
      loading: true,
      isAuthenticated: false,
      model: Models.OAI,
    };
    try {
      const response = await fetch('https://assisted-chat.api.stage.openshift.com/v1/conversations', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      authStatus.isAuthenticated = response.ok;
    } catch (error) {
      console.error('Error checking authentication:', error);
      authStatus.isAuthenticated = false;
    } finally {
      authStatus.loading = false;
    }
    return authStatus;
  }
}

export default new AsyncLSC();
