// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { BlogAll, BlogAllProps, Helmet } from '../components';
import { BlogLoading, MainLayout } from '../layout';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  <>
    <Helmet title="NEO•ONE Blog" />
    {/*
    // @ts-ignore */}
    <RouteData Loader={BlogLoading}>
      {(props: BlogAllProps) => (
        <MainLayout path="blog">
          <BlogAll {...props} />
        </MainLayout>
      )}
    </RouteData>
  </>
);
