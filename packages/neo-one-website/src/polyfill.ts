/// <reference types="trackjs" />
// tslint:disable no-submodule-imports
// tslint:disable no-import-side-effect
import '@babel/polyfill';
// @ts-ignore
import regeneratorRuntime from '@babel/runtime/regenerator';
import LogRocket from 'logrocket';
// @ts-ignore
import './Modernizr';

// tslint:disable-next-line no-any no-object-mutation
(global as any).regeneratorRuntime = regeneratorRuntime;

// tslint:disable no-object-mutation strict-type-predicates
if (typeof window !== 'undefined') {
  // @ts-ignore
  process.stdout = {
    isTTY: undefined,
  };

  if (process.env.NODE_ENV === 'production') {
    LogRocket.init('p5ugma/neo-one');
    // tslint:disable-next-line no-any
    (window as any)._trackJs = {
      token: 'ccff2c276a494f0b94462cdbf6bf4518',
      application: 'neo-one',
    };
    // tslint:disable-next-line
    const trackJs = require('trackjs');
    LogRocket.getSessionURL((url) => {
      trackJs.addMetadata('logrocket', url);
    });
  }
}
