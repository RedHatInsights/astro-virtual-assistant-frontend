// experimental implementation of loading LSC state manager via scalprum modules
import React from 'react';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { LightSpeedCoreAdditionalProperties, LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { ScalprumComponent, ScalprumComponentProps } from '@scalprum/react-core';

import { ClientAuthStatus, Models, StateManagerConfiguration } from '../aiClients/types';
import { AsyncStateManager } from './types';
import ARH_BOT_ICON from '../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';
import { AsyncMessagePlaceholder } from '../Components/AsyncMessagePlaceholder/AsyncMessagePlaceholder';
import { Message } from '@patternfly/chatbot';

type LightspeedMessage = ScalprumComponentProps<
  Record<string, unknown>,
  {
    message: MessageType<LightSpeedCoreAdditionalProperties>;
    avatar: string;
  }
>;

const AsyncMessageError = () => (
  <Message
    avatar={ARH_BOT_ICON}
    role="bot"
    content="Unable to load content"
    error={{
      title: 'unable to load message component',
      children: 'Please try again later or contact support',
      variant: 'danger',
    }}
  />
);

const LSCMessageEntry = ({ message, avatar }: { message: MessageType<LightSpeedCoreAdditionalProperties>; avatar: string }) => {
  const messageProps: LightspeedMessage = {
    message,
    avatar: message.role === 'user' ? avatar : ARH_BOT_ICON,
    scope: 'assistedInstallerApp',
    module: './ChatbotMessageEntry',
    fallback: null,
  };
  return <ScalprumComponent {...messageProps} ErrorComponent={<AsyncMessageError />} fallback={<AsyncMessagePlaceholder />} />;
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
      modelName: 'OpenShift Assisted Installer',
      docsUrl:
        'https://docs.redhat.com/en/documentation/assisted_installer_for_openshift_container_platform/2025/html/installing_openshift_container_platform_with_the_assisted_installer/index',
      selectionTitle: 'OpenShift Assisted Installer',
      selectionDescription:
        'Learn more about using the Assisted Installer as a simplified method for installing and managing OpenShift Container Platform clusters.',
      MessageEntryComponent: LSCMessageEntry,
      handleNewChat: async (toggleDrawer) => {
        // can't use hooks here, we are not yet within the correct React context
        await stateManager.createNewConversation();
        toggleDrawer(false);
      },
      isPreview: true,
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
