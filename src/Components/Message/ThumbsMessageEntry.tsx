import React, { FunctionComponent, useState } from 'react';
import { Button, Split, SplitItem, TextContent } from '@patternfly/react-core';
import ThumbsUpIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-up-icon';
import ThumbsDownIcon from '@patternfly/react-icons/dist/js/icons/outlined-thumbs-down-icon';
import { MessageOption } from '../../types/Message';
import Config from '../../Config';

interface AssistantMessageProps {
  ask: (option: MessageOption) => unknown;
  blockInput: boolean;
}

const THUMBS_UP_SELECTED_COLOR = 'green';
const THUMBS_DOWN_SELECTED_COLOR = 'red';

export const ThumbsMessageEntry: FunctionComponent<AssistantMessageProps> = ({ ask, blockInput }) => {
  const [optionSelected, setOptionSelected] = useState<'up' | 'down'>();

  const actionSelected = (selected: 'up' | 'down') => {
    if (!blockInput) {
      if (selected === 'up') {
        ask({
          payload: Config.messages.thumbs.payloads.up,
        });
      } else {
        ask({
          payload: Config.messages.thumbs.payloads.down,
        });
      }

      setOptionSelected(selected);
    }
  };

  return (
    <div className="pf-v5-u-mb-md">
      <Split>
        <SplitItem className="astro-chatbot pf-v5-u-ml-xl">
          <TextContent className="pf-v5-u-font-size-sm">
            <Button
              variant="plain"
              className="pf-v5-u-pr-xs pf-u-py-0"
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('up')}
            >
              <ThumbsUpIcon color={optionSelected === 'up' ? THUMBS_UP_SELECTED_COLOR : undefined} />
            </Button>
            <Button
              variant="plain"
              className="pf-v5-u-pr-xs pf-u-py-0"
              isDisabled={blockInput || !!optionSelected}
              onClick={() => actionSelected('down')}
            >
              <ThumbsDownIcon color={optionSelected === 'down' ? THUMBS_DOWN_SELECTED_COLOR : undefined} />
            </Button>
          </TextContent>
        </SplitItem>
      </Split>
    </div>
  );
};
