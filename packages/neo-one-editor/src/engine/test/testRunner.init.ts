// tslint:disable no-import-side-effect
import './polyfill';

import { comlink } from '@neo-one/worker';
import { TestRunner } from './TestRunner';

comlink.expose(TestRunner, self);
