// tslint:disable no-import-side-effect strict-type-predicates
import '../polyfill';

import { Redirect } from '@reach/router';
import * as React from 'react';
import { Helmet } from '../components';
import { CoreLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CoreLayout path="404">
    <Helmet title="404">
      <link rel="canonical" href={process.env.REACT_STATIC_PUBLIC_PATH} />
      <meta name="robots" content="noindex" />
      <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
      <meta httpEquiv="refresh" content={`0; url=${process.env.REACT_STATIC_PUBLIC_PATH}`} />
    </Helmet>
    <Redirect to="/" noThrow={typeof window === 'undefined'} />
  </CoreLayout>
);
