/// <reference types="@neo-one/types" />
/// <reference types="trackjs" />
// tslint:disable no-object-mutation strict-type-predicates no-import-side-effect
import '@babel/polyfill';

if (typeof window !== 'undefined') {
  // @ts-ignore
  process.stdout = {
    isTTY: undefined,
  };

  if (process.env.NODE_ENV === 'production') {
    // tslint:disable-next-line no-any
    (window as any)._trackJs = {
      token: 'ccff2c276a494f0b94462cdbf6bf4518',
      application: 'neo-one',
      callback: {
        enabled: false,
      },
      console: {
        error: false,
      },
      network: {
        error: false,
      },
      window: {
        enabled: false,
        promise: false,
      },
    };
    // tslint:disable-next-line
    const trackJs = require('trackjs');
    trackJs.addMetadata('type', 'testRunner');
  }
}
