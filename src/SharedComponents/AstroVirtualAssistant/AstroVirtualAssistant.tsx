import React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';

import { Stack, StackItem } from '@patternfly/react-core';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import UniversalBadge from '../../Components/UniversalChatbot/UniversalBadge';
import useStateManager from '../../aiClients/useStateManager';
import UniversalChatbot from '../../Components/UniversalChatbot/UniversalChatbot';
import { useIsOpen } from '../../utils/VirtualAssistantStateSingleton';

import './astro-virtual-assistant.scss';

const AstroVirtualAssistantUnified = ({
  showAssistant,
  isOpen,
  setOpen,
  className,
}: {
  showAssistant: boolean;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}) => {
  const { currentModel, managers, setCurrentModel } = useStateManager(isOpen);
  const stateManager = managers && currentModel ? managers.find((m) => m.model === currentModel)?.stateManager : undefined;
  return (
    !!stateManager &&
    !!showAssistant && (
      <AIStateProvider stateManager={stateManager}>
        <Stack className={classnames('astro-wrapper-stack', className)}>
          <StackItem>
            {isOpen ? <UniversalChatbot managers={managers} currentModel={currentModel} setCurrentModel={setCurrentModel} setOpen={setOpen} /> : null}
          </StackItem>
          <StackItem className="astro-wrapper-stack__badge pf-v6-u-mt-sm pf-v6-u-mt-xl-on-md">
            <UniversalBadge
              onClick={() => {
                setOpen((prev) => !prev);
              }}
            />
          </StackItem>
        </Stack>
      </AIStateProvider>
    )
  );
};

const AstroVirtualAssistant = (props: { showAssistant: boolean; startInput?: string; className?: string }) => {
  const [isOpen, setOpen] = useIsOpen();

  return createPortal(
    <div className="virtualAssistant">
      <AstroVirtualAssistantUnified {...props} isOpen={isOpen} setOpen={setOpen} className={props.className} />
    </div>,
    document.body,
  );
};

export default AstroVirtualAssistant;
