import React, { useEffect } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import { AstroVirtualAssistant } from '../../SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant';

/**
 * A smart component that handles all the api calls and data needed by the dumb components.
 * Smart components are usually classes.
 *
 * https://reactjs.org/docs/components-and-props.html
 * https://medium.com/@thejasonfile/dumb-components-and-smart-components-e7b33a698d43
 */
const LandingPage = () => {
  useEffect(() => {
    insights?.chrome?.appAction?.('sample-page');
  }, []);

  return (
    <React.Fragment>
      <PageHeader className="">
        <PageHeaderTitle title="Virtual assistant" />
      </PageHeader>
      <Main>
        <AstroVirtualAssistant />
      </Main>
    </React.Fragment>
  );
};

export default LandingPage;
