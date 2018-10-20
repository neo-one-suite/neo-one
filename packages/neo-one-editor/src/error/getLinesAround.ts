/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ScriptLine } from './StackFrame';

export function getLinesAround(
  line: number,
  count: number,
  linesIn: ReadonlyArray<string> | string,
): ReadonlyArray<ScriptLine> {
  let lines = linesIn;
  if (typeof lines === 'string') {
    lines = lines.split('\n');
  }
  const mutableResult = [];
  // tslint:disable-next-line no-loop-statement
  for (let index = Math.max(0, line - 1 - count); index <= Math.min(lines.length - 1, line - 1 + count); index += 1) {
    mutableResult.push(new ScriptLine(index + 1, lines[index], index === line - 1));
  }

  return mutableResult;
}
