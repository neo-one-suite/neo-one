// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import React from 'react';
import { useRouteData } from 'react-static';
import { Helmet, Tutorial, TutorialProps } from '../components';
import { ContentLayout, TutorialLoading } from '../layout';
import ModalAlertVersion from '../components/modals/ModalAlertVersion';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<TutorialProps>();

  return (
    <>
      <Helmet title="Tutorial: Intro to NEO•ONE - NEO•ONE" />
      <Suspense fallback={<TutorialLoading />}>
        <ContentLayout path="tutorial">
          <ModalAlertVersion />
          <Tutorial {...props} />
        </ContentLayout>
      </Suspense>
    </>
  );
};
