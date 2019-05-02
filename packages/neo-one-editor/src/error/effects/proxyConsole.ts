/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable no-any no-object-mutation readonly-array no-array-mutation

export interface ReactFrame {
  readonly fileName: string | null;
  readonly lineNumber: number | null;
  readonly name: string | null;
}
const reactFrameStack: (readonly ReactFrame[])[] = [];

// This is a stripped down barebones version of this proposal:
// https://gist.github.com/sebmarkbage/bdefa100f19345229d526d0fdd22830f
// We're implementing just enough to get the invalid element type warnings
// to display the component stack in React 15.6+:
// https://github.com/facebook/react/pull/9679

const registerReactStack = () => {
  // tslint:disable-next-line strict-type-predicates
  if (typeof console !== 'undefined') {
    (console as any).reactStack = (frames: readonly ReactFrame[]) => reactFrameStack.push(frames);
    (console as any).reactStackEnd = () => reactFrameStack.pop();
  }
};

const unregisterReactStack = () => {
  // tslint:disable-next-line strict-type-predicates
  if (typeof console !== 'undefined') {
    (console as any).reactStack = undefined;
    (console as any).reactStackEnd = undefined;
  }
};

type ConsoleProxyCallback = (message: string, frames: readonly ReactFrame[]) => void;
const permanentRegister = (type: string, callback: ConsoleProxyCallback) => {
  // tslint:disable-next-line strict-type-predicates
  if (typeof console !== 'undefined') {
    // tslint:disable-next-line no-any
    const orig = (console as any)[type];
    if (typeof orig === 'function') {
      // tslint:disable-next-line no-object-mutation no-any no-unused
      (console as any)[type] = function __stack_frame_overlay_proxy_console__(...args: any[]) {
        try {
          const message = args[0];
          if (typeof message === 'string' && reactFrameStack.length > 0) {
            callback(message, reactFrameStack[reactFrameStack.length - 1]);
          }
        } catch (err) {
          // Warnings must never crash. Rethrow with a clean stack.
          setTimeout(() => {
            throw err;
          });
        }

        return orig.apply(this, args);
      };
    }
  }
};

export { permanentRegister, registerReactStack, unregisterReactStack };
