// tslint:disable-next-line
import '@babel/polyfill';

import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, setup } from '@neo-one/worker';

setup();
comlink.expose(JSONRPCLocalProvider, self);

// tslint:disable-next-line no-any
const value: () => Worker = undefined as any;

// tslint:disable-next-line no-default-export export-name
export default value;
