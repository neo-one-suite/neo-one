// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { useRouteData } from 'react-static';
import { Docs, DocsProps, Helmet } from '../components';
import { N3Popup } from '../components/common';
import { ContentLayout, DocsLoading } from '../layout';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<DocsProps>();

  return (
    <>
      <Helmet title="NEO•ONE Docs" />
      <Suspense fallback={<DocsLoading />}>
        <ContentLayout path="docs">
          <N3Popup />
          <Docs {...props} />
        </ContentLayout>
      </Suspense>
    </>
  );
};
