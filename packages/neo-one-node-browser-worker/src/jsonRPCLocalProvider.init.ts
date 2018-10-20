// tslint:disable-next-line
import '@babel/polyfill';

import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink } from '@neo-one/worker';

comlink.expose(JSONRPCLocalProvider, self);
