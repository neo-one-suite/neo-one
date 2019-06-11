import { comlink } from '@neo-one/worker';
import { AsyncLanguageService } from './AsyncLanguageService';

comlink.expose(AsyncLanguageService, self);
