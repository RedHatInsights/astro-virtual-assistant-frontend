import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupText,
  Skeleton,
  TextArea,
  Title,
} from '@patternfly/react-core';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import ExpandAltIcon from '@patternfly/react-icons/dist/esm/icons/expand-alt-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';

export const AstroChatSkeleton: React.FunctionComponent<unknown> = () => {
  return (
    <div>
      <Card>
        <CardHeader
          actions={{
            actions: (
              <>
                <Button variant="plain" aria-label="Full screen" className="pf-v5-u-color-light-100">
                  <ExpandAltIcon />
                </Button>
                <Button variant="plain" aria-label="Close virtual assistant" className="pf-v5-u-color-light-100">
                  <AngleDownIcon />
                </Button>
              </>
            ),
          }}
        >
          <CardTitle>
            <Title headingLevel="h4" size="lg">
              Virtual Assistant
            </Title>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Skeleton width="80%" />
        </CardBody>
        <CardFooter>
          <InputGroup>
            <TextArea
              className="pf-v5-u-pl-md"
              placeholder="Type a message..."
              name="user-query"
              type="text"
              aria-label="User question"
              readOnlyVariant="plain"
            />
            <InputGroupText id="username">
              <Button isDisabled variant="plain" className="pf-v5-u-px-sm">
                <PlaneIcon />
              </Button>
            </InputGroupText>
          </InputGroup>
        </CardFooter>
      </Card>
    </div>
  );
};
