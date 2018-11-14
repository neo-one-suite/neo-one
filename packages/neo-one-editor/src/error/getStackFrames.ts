/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { RemoteEngine } from '../engine/remote';
import { map } from './map';
import { parse } from './parse';
import { StackFrame } from './StackFrame';

export async function getStackFrames(
  engine: RemoteEngine,
  error: Error,
  contextSize = 3,
): Promise<ReadonlyArray<StackFrame> | undefined> {
  const parsedFrames = parse(error);

  return map(engine, parsedFrames, contextSize).then((enhancedFrames) => {
    if (
      enhancedFrames.map((f) => f._originalFileName).filter((f) => f !== undefined && f.indexOf('node_modules') === -1)
        .length === 0
    ) {
      return undefined;
    }

    return enhancedFrames.filter(
      ({ functionName }) =>
        functionName === undefined || functionName.indexOf('__stack_frame_overlay_proxy_console__') === -1,
    );
  });
}
