/// <reference types="@neo-one/types" />
// tslint:disable-next-line no-import-side-effect
import './polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';

// tslint:disable-next-line export-name no-default-export
export default App;

// tslint:disable-next-line strict-type-predicates
if (typeof document !== 'undefined') {
  // tslint:disable-next-line no-any strict-boolean-expressions
  const renderMethod = (module as any).hot ? ReactDOM.render : ReactDOM.hydrate || ReactDOM.render;
  // tslint:disable-next-line no-any
  const render = (Component: any) => {
    renderMethod(<Component />, document.getElementById('root'));
  };

  render(App);
  // tslint:disable-next-line no-any
  if ((module as any).hot) {
    // tslint:disable-next-line no-any no-require-imports
    (module as any).hot.accept('./App', () => render(require('./App').App));
  }
}
