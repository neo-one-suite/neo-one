// tslint:disable no-submodule-imports
// tslint:disable no-import-side-effect
import '@babel/polyfill';
// @ts-ignore
import regeneratorRuntime from '@babel/runtime/regenerator';
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
}
