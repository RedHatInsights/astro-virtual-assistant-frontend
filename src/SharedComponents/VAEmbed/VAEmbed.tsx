import React, { useEffect, useState } from 'react';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { Bullseye, Spinner } from '@patternfly/react-core';
import classnames from 'classnames';

import UniversalChatbot from '../../Components/UniversalChatbot/UniversalChatbot';
import useStateManager from '../../aiClients/useStateManager';

export interface VAEmbedProps {
  /** Callback function called when the virtual assistant should be closed */
  onClose?: () => void;
  /** Additional CSS class name for custom styling */
  className?: string;
}

/**
 * VAEmbed - A version of the Virtual Assistant that can be embedded
 * within other components (e.g., help panels, sidebars) rather than rendered as a floating overlay.
 *
 * Unlike AstroVirtualAssistant which uses createPortal to render to document.body,
 * this component renders inline and can be placed anywhere in the component tree.
 */
const VAEmbed: React.FC<VAEmbedProps> = ({ onClose, className }) => {
  const { currentModel, managers, setCurrentModel } = useStateManager(true);
  const stateManager = managers && currentModel ? managers.find((m) => m.model === currentModel)?.stateManager : undefined;

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize state manager when available
  useEffect(() => {
    if (!stateManager) {
      return;
    }

    if (stateManager.isInitialized()) {
      // Already initialized
      setIsInitialized(true);
    } else if (!stateManager.isInitializing()) {
      // Need to initialize
      stateManager
        .init()
        .then(() => {
          setIsInitialized(true);
        })
        .catch((e) => {
          console.error('Failed to initialize state manager:', e);
          setError(e instanceof Error ? e : new Error('Failed to initialize state manager'));
          setIsInitialized(false);
        });
    }
    // If isInitializing() is true, do nothing - wait for completion
  }, [stateManager]);

  // Handle error state
  if (error) {
    return (
      <div className="va-embed-error" style={{ padding: '1rem', textAlign: 'center', color: 'var(--pf-global--danger-color--100)' }}>
        Failed to load Virtual Assistant: {error.message}
      </div>
    );
  }

  // Wait for managers to load
  if (!managers || !currentModel || !stateManager || !isInitialized) {
    return (
      <Bullseye>
        <Spinner size="lg" aria-label="Loading Virtual Assistant" />
      </Bullseye>
    );
  }

  return (
    <AIStateProvider stateManager={stateManager}>
      <div className={classnames('va-embed', className)}>
        <UniversalChatbot
          managers={managers}
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
          setOpen={() => onClose?.()}
          displayMode={ChatbotDisplayMode.embedded}
        />
      </div>
    </AIStateProvider>
  );
};

export default VAEmbed;
