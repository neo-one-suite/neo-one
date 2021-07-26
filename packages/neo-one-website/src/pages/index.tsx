// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { Helmet, Home } from '../components';
import { MainLayout } from '../layout';
import ModalAlertVersion from '../components/modals/ModalAlertVersion';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <MainLayout path="/">
    <Helmet
      title="NEO•ONE - The One for easy, fast, & fun NEO blockchain development"
      description="NEO•ONE makes coding, testing and deploying NEO dapps easier, faster, more efficient and much more enjoyable."
    />
    <ModalAlertVersion />
    <Home />
  </MainLayout>
);
