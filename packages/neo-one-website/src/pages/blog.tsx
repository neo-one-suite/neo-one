// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { Blog, BlogProps, Helmet } from '../components';
import { BlogLoading, ContentLayout } from '../layout';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  <>
    <Helmet title="NEO•ONE Blog" />
    {/*
    // @ts-ignore */}
    <RouteData Loader={BlogLoading}>
      {(props: BlogProps) => (
        <ContentLayout path="blog">
          <Blog {...props} />
        </ContentLayout>
      )}
    </RouteData>
  </>
);
