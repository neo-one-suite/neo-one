// tslint:disable-next-line
import '@babel/polyfill';

import { comlink } from '@neo-one/worker';
import { Transpiler } from './Transpiler';

comlink.expose(Transpiler, self);
