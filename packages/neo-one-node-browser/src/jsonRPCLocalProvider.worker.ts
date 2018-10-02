// tslint:disable-next-line
import '@babel/polyfill';

import { comlink, setup } from '@neo-one/worker';
import { JSONRPCLocalProvider } from './JSONRPCLocalProvider';

setup();
comlink.expose(JSONRPCLocalProvider, self);

// tslint:disable-next-line no-any
const value: () => Worker = undefined as any;

// tslint:disable-next-line no-default-export export-name
export default value;
