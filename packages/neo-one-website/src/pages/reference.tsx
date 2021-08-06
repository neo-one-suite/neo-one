// tslint:disable-next-line no-import-side-effect
import '../polyfill';

import React from 'react';
import { useRouteData } from 'react-static';
import { Helmet, ModalAlertVersion, Reference, ReferenceProps } from '../components';
import { ContentLayout, DocsLoading } from '../layout';

const { Suspense } = React;

// tslint:disable-next-line:no-default-export export-name
export default () => {
  const props = useRouteData<ReferenceProps>();

  return (
    <>
      <Helmet title="NEO•ONE Reference" />
      <Suspense fallback={<DocsLoading />}>
        <ContentLayout path="reference">
          <ModalAlertVersion />
          <Reference {...props} />
        </ContentLayout>
      </Suspense>
    </>
  );
};
