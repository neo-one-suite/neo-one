// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { Docs, DocsProps, Helmet } from '../components';
import { ContentLayout, DocsLoading } from '../layout';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  <>
    <Helmet title="NEO•ONE Docs" />
    {/*
    // @ts-ignore */}
    <RouteData Loader={DocsLoading}>
      {(props: DocsProps) => (
        <ContentLayout path="docs">
          <Docs {...props} />
        </ContentLayout>
      )}
    </RouteData>
  </>
);
