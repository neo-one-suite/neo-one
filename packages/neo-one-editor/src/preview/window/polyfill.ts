// tslint:disable no-object-mutation strict-type-predicates no-import-side-effect
import '@babel/polyfill';

if (typeof window !== 'undefined') {
  // @ts-ignore
  process.stdout = {
    isTTY: undefined,
  };
}
