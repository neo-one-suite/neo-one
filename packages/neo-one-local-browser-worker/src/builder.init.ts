// tslint:disable no-import-side-effect
import '@babel/polyfill';

import { Builder } from '@neo-one/local-browser';
import { comlink } from '@neo-one/worker';

comlink.expose(Builder, self);
