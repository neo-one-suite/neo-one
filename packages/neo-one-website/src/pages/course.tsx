// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { CourseEntry, Helmet } from '../components';
import { CourseLayout } from '../layout';
import ModalAlertVersion from '../components/modals/ModalAlertVersion';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CourseLayout>
    <Helmet
      title="NEO•ONE Courses"
      description="NEO•ONE Courses distill the essentials of dapp development into bite-sized interactive learning chapters. Build, test and write the UI for smart contracts with the NEO•ONE editor."
    />
    <ModalAlertVersion />
    <CourseEntry />
  </CourseLayout>
);
