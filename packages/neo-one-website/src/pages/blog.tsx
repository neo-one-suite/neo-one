// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import React from 'react';
import { useRouteData } from 'react-static';
import { Blog, BlogProps, Helmet } from '../components';
import { BlogLoading, ContentLayout } from '../layout';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<BlogProps>();

  return (
    <>
      <Helmet title="NEO•ONE Blog" />
      <Suspense fallback={<BlogLoading />}>
        <ContentLayout path="blog">
          <Blog {...props} />
        </ContentLayout>
      </Suspense>
    </>
  );
};
