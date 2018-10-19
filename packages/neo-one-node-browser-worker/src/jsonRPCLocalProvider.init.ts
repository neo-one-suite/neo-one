// tslint:disable-next-line
import '@babel/polyfill';

import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, setup } from '@neo-one/worker';

setup();
comlink.expose(JSONRPCLocalProvider, self);
