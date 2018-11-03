// tslint:disable no-object-mutation strict-type-predicates no-import-side-effect
import '@babel/polyfill';

import { TrackJS } from 'trackjs';

if (typeof window !== 'undefined') {
  // @ts-ignore
  process.stdout = {
    isTTY: undefined,
  };

  TrackJS.install({
    token: 'ccff2c276a494f0b94462cdbf6bf4518',
    enabled: process.env.NODE_ENV === 'production',
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
  });
  TrackJS.addMetadata('type', 'preview');
}
