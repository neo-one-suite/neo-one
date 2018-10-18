// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { Home } from '../components';
import { CoreLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CoreLayout>
    <Home />
  </CoreLayout>
);
