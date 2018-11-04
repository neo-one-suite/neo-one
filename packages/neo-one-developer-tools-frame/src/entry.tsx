// tslint:disable no-import-side-effect no-object-mutation
import '@babel/polyfill';
import '../static/fonts.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BehaviorSubject } from 'rxjs';
import { Clients, DeveloperTools } from './DeveloperTools';
import { ResizeHandler } from './ResizeHandler';
import { DeveloperToolsOptions } from './types';

// tslint:disable-next-line export-name
export function applyStyles(element: HTMLElement, styles: object) {
  element.setAttribute('style', '');
  // tslint:disable-next-line no-loop-statement
  for (const [key, val] of Object.entries(styles)) {
    // @ts-ignore
    element.style[key] = val;
  }
}

document.body.style.margin = '0';
// Keep popup within body boundaries for iOS Safari
// @ts-ignore
document.body.style['max-width'] = '100vw';
const root = document.createElement('div');
applyStyles(root, {
  width: '100%',
  height: '100%',
  'box-sizing': 'border-box',
});
document.body.appendChild(root);

// tslint:disable no-let
let resizeHandler: ResizeHandler | undefined;
let clients$: BehaviorSubject<Clients> | undefined;
let rendered = false;
// tslint:enable no-let

const render = ({ onResize, maxWidth, ...props }: DeveloperToolsOptions) => {
  if (resizeHandler === undefined) {
    resizeHandler = new ResizeHandler(onResize, maxWidth);
  } else {
    resizeHandler.updateOnResize(onResize);
    resizeHandler.updateMaxWidth(maxWidth);
  }

  if (clients$ === undefined) {
    clients$ = new BehaviorSubject(props);
  } else {
    clients$.next(props);
  }

  if (!rendered) {
    rendered = true;
    ReactDOM.render(<DeveloperTools clients$={clients$} resizeHandler={resizeHandler} />, root);
  }
};

// tslint:disable-next-line no-any
(window as any).updateOptions = render;

// tslint:disable-next-line no-any
render((window as any).parent.__NEO_ONE_DEVELOPER_TOOLS__.initialize());
