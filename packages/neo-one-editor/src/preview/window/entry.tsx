// tslint:disable no-import-side-effect
import '@babel/polyfill';
import './polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PreviewEngine } from '../../engine';
import { App } from './App';

const createPreviewEngine = async () => {
  const { port } = await new Promise<{ port: MessagePort }>((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data.port !== undefined) {
        resolve(event.data);
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);

    const parentOrOpener = window.parent === window ? (window.opener as Window | undefined) : window.parent;
    if (parentOrOpener !== undefined) {
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
  startPromise = createPreviewEngine().catch((error) => {
    // tslint:disable-next-line no-console
    console.error(error);
  });
}

ReactDOM.render(<App startPromise={startPromise} />, document.getElementById('app'));
