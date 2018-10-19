// tslint:disable-next-line
import '@babel/polyfill';

import { Builder } from '@neo-one/local-browser';
import { comlink, setup } from '@neo-one/worker';

setup();
comlink.expose(Builder, self);
