// tslint:disable no-object-mutation strict-type-predicates no-import-side-effect
import '@babel/polyfill';

// @ts-ignore
process.stdout = {
  isTTY: undefined,
};
