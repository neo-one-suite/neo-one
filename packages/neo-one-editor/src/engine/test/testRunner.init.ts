// tslint:disable no-import-side-effect
import './polyfill';

import { comlink } from '@neo-one/worker';
import { TestRunner } from './TestRunner';

const init = (win: Window, parent: Window, opener: Window | undefined) => {
  const parentOrOpener = parent === win ? (opener as Window | null) : parent;
  if (parentOrOpener !== null) {
    comlink.expose(TestRunner, parentOrOpener);
    parentOrOpener.postMessage({ type: 'initialize' }, '*');
  }
};

init(window, window.parent, window.opener);
