// tslint:disable no-import-side-effect
import '@babel/polyfill';

import '../trackjs';

import { comlink } from '@neo-one/worker';
import { AsyncLanguageService } from './AsyncLanguageService';

comlink.expose(AsyncLanguageService, self);
