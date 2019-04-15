// tslint:disable strict-type-predicates
// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import { Redirect } from '@reach/router';
import React from 'react';
import { useRouteData } from 'react-static';
import { Helmet } from '../components';
import { DocsLoading } from '../layout';

const { Suspense } = React;

interface ReferenceRedirectProps {
  readonly redirect: string;
}

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const { redirect } = useRouteData<ReferenceRedirectProps>();

  return (
    <>
      <Helmet title="NEO•ONE Reference" />
      <Suspense fallback={<DocsLoading />}>
        <Redirect to={redirect} noThrow />
      </Suspense>
    </>
  );
};
