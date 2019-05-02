/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// tslint:disable
import { register as registerError, unregister as unregisterError } from './effects/unhandledError';
import { register as registerPromise, unregister as unregisterPromise } from './effects/unhandledRejection';
import {
  register as registerStackTraceLimit,
  unregister as unregisterStackTraceLimit,
} from './effects/stackTraceLimit';
import {
  permanentRegister as permanentRegisterConsole,
  registerReactStack,
  unregisterReactStack,
} from './effects/proxyConsole';
import { massage as massageWarning } from './warnings';
import { getStackFrames } from './getStackFrames';
import { StackFrame } from './StackFrame';
import { RemoteEngine } from '../engine/remote';

const CONTEXT_SIZE: number = 3;

export type ErrorRecord = {
  error: Error;
  unhandledRejection: boolean;
  contextSize: number;
  stackFrames: readonly StackFrame[];
};

export function listenToRuntimeErrors(
  engine: RemoteEngine,
  crash: (val: ErrorRecord) => void,
  filename: string = '/static/js/bundle.js',
) {
  function crashWithFrames(error: Error, unhandledRejection = false) {
    getStackFrames(engine, error, CONTEXT_SIZE)
      .then((stackFrames) => {
        if (stackFrames == null) {
          return;
        }
        crash({
          error,
          unhandledRejection,
          contextSize: CONTEXT_SIZE,
          stackFrames,
        });
      })
      .catch((e) => {
        console.log('Could not get the stack frames of error:', e);
      });
  }
  registerError(window, (error) => crashWithFrames(error, false));
  registerPromise(window, (error) => crashWithFrames(error, true));
  registerStackTraceLimit();
  registerReactStack();
  permanentRegisterConsole('error', (warning, stack) => {
    const data = massageWarning(warning, stack);
    crashWithFrames(
      {
        message: data.message,
        stack: data.stack,
      } as any,
      false,
    );
  });

  return function stopListening() {
    unregisterStackTraceLimit();
    unregisterPromise(window);
    unregisterError(window);
    unregisterReactStack();
  };
}
