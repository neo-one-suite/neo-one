// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import * as React from 'react';
import { CourseApp } from '../components';
import { CourseLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default () => (
  <CourseLayout>
    <CourseApp />
  </CourseLayout>
);
