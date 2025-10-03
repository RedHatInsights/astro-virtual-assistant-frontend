import React, { Ref, RefObject, useContext, useState } from 'react';
import { Flex, FlexItem, Label, MenuItemAction, MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';

import { UniversalChatbotContext } from './UniversalChatbotProvider';
import { isModels } from '../../aiClients/types';

import './UniversalAssistantSelection.scss';
import { HelpIcon, InfoCircleIcon } from '@patternfly/react-icons';

function UniversalAssistantSelection({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
  const { currentModel, setCurrentModel, managers } = useContext(UniversalChatbotContext);
  const [isOpen, setIsOpen] = useState(false);

  const modelName = managers?.find((m) => m.model === currentModel)?.selectionTitle || currentModel;
  if (managers && managers.length <= 1) {
    // no need for switcher if there is only one option
    return null;
  }

  const toggle = (toggleRef: Ref<HTMLButtonElement>) => (
    <MenuToggle className="universal-model-selection__toggle" ref={toggleRef} onClick={() => setIsOpen((prev) => !prev)} isExpanded={isOpen}>
      <b>AI Assistant:</b>
      &nbsp;{modelName}
      <Label className="pf-v6-u-ml-md" isCompact>
        AI
      </Label>
    </MenuToggle>
  );
  return (
    <>
      <Flex
        className="pf-u-p-sm universal-model-selection"
        justifyContent={{ default: 'justifyContentSpaceAround' }}
        alignItems={{ default: 'alignItemsCenter' }}
      >
        <FlexItem className="pf-v6-u-pt-sm pf-v6-u-pb-sm pf-v6-u-pr-md pf-v6-u-pl-md" grow={{ default: 'grow' }}>
          <Select
            toggle={toggle}
            isOpen={isOpen}
            popperProps={{
              appendTo: containerRef.current || document.body,
            }}
            onOpenChange={(isOpen) => setIsOpen(isOpen)}
            onOpenChangeKeys={['Escape']}
            id="ai-model-select"
            selected={currentModel}
            onSelect={(_e, value) => {
              if (isModels(value)) {
                setCurrentModel(value);
                setIsOpen(false);
              }
            }}
          >
            <SelectList aria-label="AI Model selection">
              {managers?.map((manager) => (
                <SelectOption
                  description={manager.selectionDescription}
                  value={manager.model}
                  key={manager.model}
                  isSelected={currentModel === manager.model}
                  actions={[
                    <MenuItemAction
                      aria-label={`Documentation for ${manager.model}`}
                      key="docs-link"
                      icon={
                        <a className="universal-model-selection__help-icon" href={manager.docsUrl} target="_blank" rel="noopener noreferrer">
                          <HelpIcon />
                        </a>
                      }
                    />,
                  ]}
                >
                  {manager.selectionTitle}
                  {manager.isPreview && (
                    <Label icon={<InfoCircleIcon />} color="orange" className="pf-v6-u-ml-sm" isCompact>
                      Preview
                    </Label>
                  )}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FlexItem>
      </Flex>
    </>
  );
}

export default UniversalAssistantSelection;
