import React, { useEffect, useLayoutEffect } from 'react';

import { Main } from '@redhat-cloud-services/frontend-components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import AstroVirtualAssistant from '../../SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant';
import './landing-page.scss';

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

  // This is only used to delete the lightbulb for testing purposes
  useLayoutEffect(() => {
    const observer = new MutationObserver(() => {
      const badges = document.getElementsByClassName('_pendo-badge');
      for (let i = 0; i < badges.length; ++i) {
        const element = badges.item(i);
        if (element) {
          element.remove();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <React.Fragment>
      <PageHeader className="">
        <PageHeaderTitle title="Virtual assistant" />
      </PageHeader>
      <Main>
        <div className="astro__landing-page">
          <AstroVirtualAssistant />
        </div>
      </Main>
    </React.Fragment>
  );
};

export default LandingPage;
