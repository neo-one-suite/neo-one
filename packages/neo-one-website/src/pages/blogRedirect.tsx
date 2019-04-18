// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import { Redirect } from '@reach/router';
import React from 'react';
import { useRouteData } from 'react-static';
import { Helmet } from '../components';
import { BlogLoading } from '../layout';

const { Suspense } = React;

interface BlogRedirectProps {
  readonly redirect: string;
}

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const { redirect } = useRouteData<BlogRedirectProps>();

  return (
    <>
      <Helmet title="NEO•ONE Blog" />
      <Suspense fallback={<BlogLoading />}>
        <Redirect to={redirect} noThrow />
      </Suspense>
    </>
  );
};
