// tslint:disable no-import-side-effect
import './polyfill';

import { comlink } from '@neo-one/worker';
import { TestRunner } from './TestRunner';

const init = (win: Window, parent: Window, opener: Window | null) => {
  const parentOrOpener = parent === win ? opener : parent;
  if (parentOrOpener !== null) {
    comlink.expose(TestRunner, parentOrOpener);
  }
};

init(window, window.parent, window.opener);
