import React, { FunctionComponent, useState } from 'react';
import { Button, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import Config from '../../Config';
import { AskOptions } from '../AstroChat/useAstro';

interface AssistantMessageProps {
  ask: (option: AskOptions) => unknown;
  blockInput: boolean;
}

const SELECTED_CLASS = 'selected';

export const ThumbsMessageEntry: FunctionComponent<AssistantMessageProps> = ({ ask, blockInput }) => {
  const [optionSelected, setOptionSelected] = useState<'up' | 'down'>();

  const actionSelected = (selected: 'up' | 'down') => {
    if (!blockInput) {
      if (selected === 'up') {
        ask({
          label: Config.messages.thumbs.payloads.up,
          hideMessage: true,
        });
      } else {
        ask({
          label: Config.messages.thumbs.payloads.down,
          hideMessage: true,
        });
      }

      setOptionSelected(selected);
    }
  };

  return (
    <div className="pf-v5-u-mb-md">
      <Split>
        <SplitItem className="pf-v5-u-ml-xl">
          <TextContent className="astro-thumbs pf-v5-u-font-size-sm">
            <Button
              variant="plain"
              className={optionSelected === 'up' ? SELECTED_CLASS : 'pf-v5-u-pr-sm pf-u-py-0'}
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('up')}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              variant="plain"
              className={optionSelected === 'down' ? SELECTED_CLASS : 'pf-u-py-0'}
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('down')}
            >
              <ThumbsDownIcon />
            </Button>
          </TextContent>
        </SplitItem>
      </Split>
    </div>
  );
};
