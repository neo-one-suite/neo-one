// tslint:disable-next-line
import '@babel/polyfill';

import { comlink, setup } from '@neo-one/worker';
import { Transpiler } from './Transpiler';

setup();
comlink.expose(Transpiler, self);
