import { Loading } from '@neo-one/react-common';
import * as React from 'react';
import { MainLayout } from './MainLayout';

export const DocsLoading = () => (
  <MainLayout path="docs">
    <Loading />
  </MainLayout>
);
