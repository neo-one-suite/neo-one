import * as React from 'react';
import { CoreLayout } from './CoreLayout';

interface Props {
  readonly path: string;
  readonly children: React.ReactNode;
}

export const MainLayout = (props: Props) => <CoreLayout {...props} content={false} />;
