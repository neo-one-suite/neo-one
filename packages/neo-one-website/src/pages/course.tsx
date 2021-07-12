// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { CourseEntry, Helmet } from '../components';
import { N3Popup } from '../components/common';
import { CourseLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CourseLayout>
    <Helmet
      title="NEO•ONE Courses"
      description="NEO•ONE Courses distill the essentials of dapp development into bite-sized interactive learning chapters. Build, test and write the UI for smart contracts with the NEO•ONE editor."
    />
    <N3Popup />
    <CourseEntry />
  </CourseLayout>
);
