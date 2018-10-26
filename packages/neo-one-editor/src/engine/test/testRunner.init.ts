// tslint:disable no-import-side-effect
import './polyfill';

import { comlink } from '@neo-one/worker';
import { TestRunner } from './TestRunner';

const parentOrOpener = window.parent === window ? (window.opener as Window | undefined) : window.parent;
if (parentOrOpener !== undefined) {
  comlink.expose(TestRunner, parentOrOpener);
  parentOrOpener.postMessage({ type: 'initialize' }, '*');
}
