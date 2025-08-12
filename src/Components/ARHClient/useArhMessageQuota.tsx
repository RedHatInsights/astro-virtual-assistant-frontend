import React, { Fragment, useMemo } from 'react';
import { IFDAdditionalAttributes } from '@redhat-cloud-services/arh-client';
import { Message } from '@redhat-cloud-services/ai-client-state';
import { AlertActionLink, AlertProps, AlertVariant, Content } from '@patternfly/react-core';
import { useCreateNewConversation } from '@redhat-cloud-services/ai-react-state';

export type ARHMessageQuotaState = AlertProps | undefined;

function quotaExceeded(quota: IFDAdditionalAttributes['quota']) {
  if (!quota || !quota.enabled || !quota.quota?.limit || !quota.quota?.used) {
    return false;
  }
  return quota.quota.used >= quota.quota.limit;
}

const useArhMessageQuota = (message?: Message<IFDAdditionalAttributes>) => {
  const quota = message?.additionalAttributes?.quota;
  const createNewConversation = useCreateNewConversation();
  const quotaLimit = useMemo<ARHMessageQuotaState>(() => {
    if (!quota || !quota.enabled || !quota.quota?.limit || !quota.quota?.used) {
      return undefined;
    }

    if (quota.quota.used + 5 === quota.quota.limit) {
      return {
        variant: AlertVariant.warning,
        title: (
          <Content>
            <i>
              You are nearing the message limit for this conversation. {quota.quota.used} of {quota.quota.limit} messages used.
            </i>
          </Content>
        ),
      };
    }

    if (quotaExceeded(quota)) {
      return {
        variant: AlertVariant.danger,
        title: 'Message limit reached',
        children: <Content>You have reached the message limit for this conversation. To continue, you can start a new chat.</Content>,
        actionLinks: (
          <Fragment>
            <AlertActionLink onClick={() => createNewConversation()}>Start a new chat</AlertActionLink>
          </Fragment>
        ),
      };
    }
  }, [quota?.enabled, quota?.quota?.limit, quota?.quota?.used]);
  return quotaLimit;
};

export default useArhMessageQuota;
