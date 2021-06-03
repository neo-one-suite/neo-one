// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { Helmet, Home } from '../components';
import { N3Popup } from '../components/common';
import { MainLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <MainLayout path="/">
    <Helmet
      title="NEO•ONE - The One for easy, fast, & fun NEO blockchain development"
      description="NEO•ONE makes coding, testing and deploying NEO dapps easier, faster, more efficient and much more enjoyable."
    />
    <N3Popup />
    <Home />
  </MainLayout>
);
