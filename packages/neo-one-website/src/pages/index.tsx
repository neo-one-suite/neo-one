// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { RouteData } from 'react-static';
import { Helmet, Home } from '../components';
import { CoreLayout, DocsLoading } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  // @ts-ignore
  <RouteData Loader={DocsLoading}>
    {({ mostRecentBlogPostSlug }: { readonly mostRecentBlogPostSlug: string }) => (
      <CoreLayout path="/" mostRecentBlogPostSlug={mostRecentBlogPostSlug}>
        <Helmet
          title="NEO•ONE - The One for easy, fast, & fun NEO blockchain development"
          description="NEO•ONE makes coding, testing and deploying NEO dapps easier, faster, more efficient and much more enjoyable."
        />
        <Home />
      </CoreLayout>
    )}
  </RouteData>
);
