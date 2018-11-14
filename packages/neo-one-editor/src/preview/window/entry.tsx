// tslint:disable no-import-side-effect
import './polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PreviewEngine } from '../../engine/preview';
import { App } from './App';

const createPreviewEngine = async (win: Window, parent: Window, opener: Window | null) => {
  const { port } = await new Promise<{ port: MessagePort }>((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data.port !== undefined) {
        resolve(event.data);
        win.removeEventListener('message', handler);
      }
    };
    win.addEventListener('message', handler);

    const parentOrOpener = parent === win ? opener : parent;
    if (parentOrOpener !== null) {
      parentOrOpener.postMessage({ type: 'initialize' }, '*');
    }
  });

  const engine = await PreviewEngine.create({ port });
  engine.start();
};

// tslint:disable-next-line no-let
let startPromise: Promise<void> = Promise.resolve();
// tslint:disable-next-line strict-type-predicates
if (typeof window !== 'undefined') {
  startPromise = createPreviewEngine(window, window.parent, window.opener).catch((error) => {
    // tslint:disable-next-line no-console
    console.error(error);
  });
}

ReactDOM.render(<App startPromise={startPromise} />, document.getElementById('app'));
