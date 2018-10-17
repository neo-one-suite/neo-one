import { Loading } from '@neo-one/react-common';
import * as React from 'react';

interface Props {
  readonly startPromise: Promise<void>;
}

export const App = (_props: Props) => <Loading />;
