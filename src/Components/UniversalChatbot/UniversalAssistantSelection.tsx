import React, { Ref, RefObject, useContext, useState } from 'react';
import { Flex, FlexItem, Label, MenuItemAction, MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';

import { UniversalChatbotContext } from './UniversalChatbotProvider';
import { isModels } from '../../aiClients/types';

import './UniversalAssistantSelection.scss';
import { HelpIcon } from '@patternfly/react-icons';

function UniversalAssistantSelection({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
  const { model, setCurrentModel, availableManagers } = useContext(UniversalChatbotContext);
  const [isOpen, setIsOpen] = useState(false);

  const modelName = availableManagers.find((m) => m.model === model)?.selectionTitle || model;
  if (availableManagers.length <= 1) {
    // no need for switcher if there is only one option
    return null;
  }

  const toggle = (toggleRef: Ref<HTMLButtonElement>) => (
    <MenuToggle className="universal-model-selection__toggle" ref={toggleRef} onClick={() => setIsOpen((prev) => !prev)} isExpanded={isOpen}>
      <b>Assistant:</b>
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
            selected={model}
            onSelect={(_e, value) => {
              if (isModels(value)) {
                setCurrentModel(value);
                setIsOpen(false);
              }
            }}
          >
            <SelectList aria-label="AI Model selection">
              {availableManagers.map((manager) => (
                <SelectOption
                  description={manager.selectionDescription}
                  value={manager.model}
                  key={manager.model}
                  isSelected={model === manager.model}
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
