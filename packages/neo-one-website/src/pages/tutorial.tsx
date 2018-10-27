// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { Helmet, Tutorial, TutorialProps } from '../components';
import { ContentLayout, TutorialLoading } from '../layout';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  <>
    <Helmet title="Tutorial: Intro to NEO•ONE - NEO•ONE" />
    {/*
    // @ts-ignore */}
    <RouteData Loader={TutorialLoading}>
      {(props: TutorialProps) => (
        <ContentLayout path="tutorial">
          <Tutorial {...props} />
        </ContentLayout>
      )}
    </RouteData>
  </>
);
