// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import React from 'react';
import { useRouteData } from 'react-static';
import { Helmet, Tutorial, TutorialProps } from '../components';
import { N3Popup } from '../components/common';
import { ContentLayout, TutorialLoading } from '../layout';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<TutorialProps>();

  return (
    <>
      <Helmet title="Tutorial: Intro to NEO•ONE - NEO•ONE" />
      <Suspense fallback={<TutorialLoading />}>
        <ContentLayout path="tutorial">
          <N3Popup />
          <Tutorial {...props} />
        </ContentLayout>
      </Suspense>
    </>
  );
};
