import { AbortController as AbortControllerPolyfill } from './AbortController';

// tslint:disable-next-line strict-type-predicates no-any
const g: any = typeof self !== 'undefined' ? self : global;

export const AbortController: typeof AbortControllerPolyfill = g.AbortController
  ? g.AbortController
  : AbortControllerPolyfill;
