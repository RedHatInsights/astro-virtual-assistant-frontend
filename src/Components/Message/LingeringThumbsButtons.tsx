import React, { FunctionComponent, useState } from 'react';
import { Button, Content, Split, SplitItem } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import Config from '../../Config';
import { AskOptions } from '../AstroChat/useAstro';

interface AssistantMessageProps {
  ask: (option: AskOptions) => unknown;
  blockInput: boolean;
  setThumbsSelected?: (selected: boolean) => void;
}

const SELECTED_CLASS = 'selected';

export const LingeringThumbsButtons: FunctionComponent<AssistantMessageProps> = ({ ask, blockInput, setThumbsSelected }) => {
  const [optionSelected, setOptionSelected] = useState<'up' | 'down'>();

  const actionSelected = (selected: 'up' | 'down') => {
    if (!blockInput) {
      if (selected === 'up') {
        ask({
          label: Config.messages.lingering_thumbs.payloads.up,
          hideMessage: true,
        });
      } else {
        ask({
          label: Config.messages.lingering_thumbs.payloads.down,
          hideMessage: true,
        });
      }

      setOptionSelected(selected);
      if (setThumbsSelected) {
        setThumbsSelected(true);
      }
    }
  };

  return (
    <div className="astro-thumbs-lingering">
      <Split>
        <SplitItem className="pf-v6-u-ml-xl">
          <Content className="astro-thumbs pf-v6-u-font-size-sm">
            <Button
              id="thumbs-up"
              icon={<ThumbsUpIcon />}
              variant="plain"
              className={optionSelected === 'up' ? SELECTED_CLASS : 'pf-v6-u-pr-sm pf-u-py-0'}
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('up')}
            />
            <Button
              id="thumbs-down"
              icon={<ThumbsDownIcon />}
              variant="plain"
              className={optionSelected === 'down' ? SELECTED_CLASS : 'pf-u-py-0'}
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('down')}
            />
          </Content>
        </SplitItem>
      </Split>
    </div>
  );
};
