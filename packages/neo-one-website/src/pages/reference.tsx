// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { Helmet, Reference, ReferenceProps } from '../components';
import { ContentLayout, DocsLoading } from '../layout';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  <>
    <Helmet title="NEO•ONE Reference" />
    {/*
    // @ts-ignore */}
    <RouteData Loader={DocsLoading}>
      {(props: ReferenceProps) => (
        <ContentLayout path="reference">
          <Reference {...props} />
        </ContentLayout>
      )}
    </RouteData>
  </>
);
