// tslint:disable no-import-side-effect no-object-mutation
import '@babel/polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DeveloperTools } from './DeveloperTools';
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

// tslint:disable-next-line no-let
let resizeHandler: ResizeHandler | undefined;

const render = ({ onResize, maxWidth, ...props }: DeveloperToolsOptions) => {
  if (resizeHandler === undefined) {
    resizeHandler = new ResizeHandler(onResize, maxWidth);
    ReactDOM.render(<DeveloperTools {...props} resizeHandler={resizeHandler} />, root);
  } else {
    resizeHandler.updateOnResize(onResize);
    resizeHandler.updateMaxWidth(maxWidth);
  }
};

// tslint:disable-next-line no-any
(window as any).updateOptions = render;

// tslint:disable-next-line no-any
render((window as any).parent.__NEO_ONE_DEVELOPER_TOOLS__.initialize());
