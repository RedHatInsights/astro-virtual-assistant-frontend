import React, { useEffect } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import {
  Button,
  Divider,
  Icon,
  InputGroup,
  InputGroupText,
  InputGroupTextVariant,
  Label,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextInput,
  Title,
} from '@patternfly/react-core';

import RedoIcon from '@patternfly/react-icons/dist/esm/icons/redo-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';
import MinimizeIcon from '@patternfly/react-icons/dist/esm/icons/window-minimize-icon';

import './sample-page.scss';

/**
 * A smart component that handles all the api calls and data needed by the dumb components.
 * Smart components are usually classes.
 *
 * https://reactjs.org/docs/components-and-props.html
 * https://medium.com/@thejasonfile/dumb-components-and-smart-components-e7b33a698d43
 */
const SamplePage = () => {
  useEffect(() => {
    insights?.chrome?.appAction?.('sample-page');
  }, []);

  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="Virtual assistant" />
      </PageHeader>
      <Main>
        <Stack className="astro-l-stack">
          <StackItem className="astro-l-stack__header pf-u-background-color-active-color-100">
            <Split hasGutter>
              <SplitItem isFilled>
                <TextContent className="pf-u-p-md pf-u-color-light-100">
                  <Text>Answer Blaster 3000-Ultra 2.0</Text>
                </TextContent>
              </SplitItem>
              <SplitItem>
                <Button variant="plain" aria-label="Action" className="pf-u-p-md pf-u-pr-0 pf-u-color-light-100">
                  <MinimizeIcon />
                </Button>
                <Button variant="plain" aria-label="Action" className="pf-u-p-md pf-u-pl-sm pf-u-color-light-100">
                  <TimesIcon />
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
          <StackItem className="astro-l-stack__body pf-u-p-md pf-m-scrollable" isFilled>
            {/*chat content area*/}

            <Split className="astro-chatbot">
              <SplitItem className="astro-chatbot-dialog bubble">Which set of Hybrid Cloud Console services can I help you with?</SplitItem>
            </Split>

            <div className="astro-options">
              <Label>OpenShift</Label>
              <Label>Ansible</Label>
              <Label>RHEL</Label>
              <Label>Cloud Native Development</Label>
              <Label>Console Services</Label>
            </div>

            <Split className="astro-user">
              <SplitItem className="astro-user-dialog bubble bubble-user">OpenShift</SplitItem>
            </Split>

            {/* end chat content area*/}
          </StackItem>
          <StackItem className="astro-l-stack__footer">
            <InputGroup>
              <TextInput placeholder="Type a message..." name="" id="" type="text" aria-label="" />
              <InputGroupText id="username">
                <Button variant="plain" className="pf-u-px-sm">
                  <RedoIcon />
                </Button>
                <Button variant="plain" className="pf-u-px-sm">
                  <PlaneIcon />
                </Button>
              </InputGroupText>
            </InputGroup>
          </StackItem>
        </Stack>
      </Main>
    </React.Fragment>
  );
};

export default SamplePage;
