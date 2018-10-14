import * as React from 'react';
import { Loading } from '../../Loading';

interface Props {
  readonly startPromise: Promise<void>;
}

export const App = (_props: Props) => <Loading />;
