// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { AllPosts, Helmet } from '../components';
import { CoreLayout, DocsLoading } from '../layout';
import { MDBlogHeader } from '../utils';

interface Props {
  readonly posts: ReadonlyArray<MDBlogHeader>;
  readonly mostRecentBlogPostSlug: string;
}

// tslint:disable-next-line:no-default-export export-name
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {({ posts, mostRecentBlogPostSlug }: Props) => (
      <CoreLayout path="blog" mostRecentBlogPostSlug={mostRecentBlogPostSlug}>
        <Helmet title="All Posts" />
        <AllPosts posts={posts} />
      </CoreLayout>
    )}
  </RouteData>
);
