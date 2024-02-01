import React from 'react';
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  InputGroup,
  InputGroupText,
  Skeleton,
  Text,
  TextArea,
  TextAreaReadOnlyVariant,
  Title,
} from '@patternfly/react-core';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import ExpandAltIcon from '@patternfly/react-icons/dist/esm/icons/expand-alt-icon';
import PlaneIcon from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';

export const AstroChatSkeleton: React.FunctionComponent<unknown> = () => {
  return (
    <div>
      <Card className="astro-c-card">
        <CardHeader className="astro-c-card__header">
          <CardTitle>
            <Title headingLevel="h4" size="lg" className="pf-u-color-light-100">
              Virtual Assistant
            </Title>
          </CardTitle>
          <CardActions>
            <Button variant="plain" aria-label="Full screen" className="pf-v5-u-color-light-100">
              <ExpandAltIcon />
            </Button>
            <Button variant="plain" aria-label="Close virtual assistant" className="pf-v5-u-color-light-100">
              <AngleDownIcon />
            </Button>
          </CardActions>
        </CardHeader>
        <CardBody className="astro-c-card__body pf-v5-u-px-md pf-v5-u-pt-xl pf-v5-m-scrollable pf-v5-u-background-color-100">
          <Skeleton width="80%" />
        </CardBody>
        <CardFooter className="astro-c-card__footer pf-v5-u-p-0">
          <InputGroup>
            <TextArea
              placeholder="Type a message..."
              name="user-query"
              type="text"
              aria-label="User question"
              className="pf-v5-u-pt-md pf-v5-u-pl-md"
              readOnlyVariant={TextAreaReadOnlyVariant.plain}
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
