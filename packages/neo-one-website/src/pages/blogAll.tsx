// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import React from 'react';
import { useRouteData } from 'react-static';
import { BlogAll, BlogAllProps, Helmet } from '../components';
import { BlogLoading, MainLayout } from '../layout';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<BlogAllProps>();

  return (
    <>
      <Suspense fallback={<BlogLoading />}>
        <Helmet title="NEO•ONE Blog" />
        <MainLayout path="blog">
          <BlogAll {...props} />
        </MainLayout>
      </Suspense>
    </>
  );
};
