import React, { Ref, RefObject, useContext, useState } from 'react';
import { Flex, FlexItem, Label, MenuItemAction, MenuToggle, Select, SelectList, SelectOption, Split, SplitItem } from '@patternfly/react-core';

import { UniversalChatbotContext } from './UniversalChatbotProvider';

import './UniversalModelSelection.scss';
import { HelpIcon } from '@patternfly/react-icons';
import PreviewBadge from './PreviewBadge';

function UniversalModelSelection({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) {
  const { model, setCurrentModel, availableManagers } = useContext(UniversalChatbotContext);
  const [isOpen, setIsOpen] = useState(false);

  const stateManager = model ? availableManagers[model]?.stateManager : undefined;
  const modelName = stateManager?.selectionTitle || '';

  const toggle = (toggleRef: Ref<HTMLButtonElement>) => (
    <MenuToggle className="universal-model-selection__toggle" ref={toggleRef} onClick={() => setIsOpen((prev) => !prev)} isExpanded={isOpen}>
      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignContent={{ default: 'alignContentSpaceBetween' }}>
        <FlexItem>
          <b>Model:</b>
          &nbsp;{modelName}
        </FlexItem>
        {stateManager?.isPreview && (
          <FlexItem>
            <PreviewBadge />
          </FlexItem>
        )}
      </Flex>
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
              setCurrentModel(`${value}`);
              setIsOpen(false);
            }}
          >
            <SelectList aria-label="AI Model selection">
              {Object.entries(availableManagers)
                .sort((a, b) => a[1].stateManager.selectionTitle.localeCompare(b[1].stateManager.selectionTitle))
                .map(([id, { stateManager }]) => (
                  <SelectOption
                    description={stateManager.selectionDescription}
                    value={id}
                    key={id}
                    isSelected={model === id}
                    actions={[
                      stateManager.isPreview && <PreviewBadge key="preview" />,
                      <MenuItemAction
                        aria-label={`Documentation for ${stateManager.modelName}`}
                        key="docs-link"
                        icon={
                          <a className="universal-model-selection__help-icon" href={stateManager.docsUrl} target="_blank" rel="noopener noreferrer">
                            <HelpIcon />
                          </a>
                        }
                      />,
                    ]}
                  >
                    {availableManagers[id].stateManager.selectionTitle}
                  </SelectOption>
                ))}
            </SelectList>
          </Select>
        </FlexItem>
      </Flex>
    </>
  );
}

export default UniversalModelSelection;
