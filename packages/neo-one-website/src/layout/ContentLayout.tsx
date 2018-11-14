import * as React from 'react';
import { CoreLayout } from './CoreLayout';

interface Props {
  readonly path: string;
  readonly children: React.ReactNode;
}

export const ContentLayout = (props: Props) => <CoreLayout {...props} content />;
