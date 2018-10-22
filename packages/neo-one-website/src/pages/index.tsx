// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { Helmet, Home } from '../components';
import { CoreLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CoreLayout>
    <Helmet
      title="NEO•ONE - The One for easy, fast, & fun NEO blockchain development"
      description="NEO•ONE makes coding, testing and deploying NEO dapps easier, faster, more efficient and much more satisfying."
    />
    <Home />
  </CoreLayout>
);
