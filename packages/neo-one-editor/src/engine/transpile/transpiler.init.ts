// tslint:disable no-import-side-effect
import '@babel/polyfill';

import '../../trackjs';

import { comlink } from '@neo-one/worker';
import { Transpiler } from './Transpiler';

comlink.expose(Transpiler, self);
