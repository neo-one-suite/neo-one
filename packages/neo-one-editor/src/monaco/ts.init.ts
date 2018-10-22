// tslint:disable-next-line
import '@babel/polyfill';

import { comlink } from '@neo-one/worker';
import { AsyncLanguageService } from './AsyncLanguageService';

comlink.expose(AsyncLanguageService, self);
