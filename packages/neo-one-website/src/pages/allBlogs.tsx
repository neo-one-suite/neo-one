// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { AllPosts, Helmet } from '../components';
import { CoreLayout, DocsLoading } from '../layout';
import { MDBlogHeader } from '../utils';

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {(posts: ReadonlyArray<MDBlogHeader>) => (
      <CoreLayout path="blog">
        <Helmet title="All Posts" />
        <AllPosts posts={posts} />
      </CoreLayout>
    )}
  </RouteData>
);
