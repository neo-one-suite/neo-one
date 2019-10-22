// tslint:disable strict-type-predicates no-object-mutation
import { TrackJS } from '@neo-one/react-common';

if (typeof window !== 'undefined') {
  // @ts-ignore
  process.stdout = {
    isTTY: false,
  };
}

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
TrackJS.addMetadata('type', 'testRunner');
