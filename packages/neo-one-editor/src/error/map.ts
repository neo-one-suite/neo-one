/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { initializeSourceMap } from '@neo-one/client-switch';
import fetch from 'cross-fetch';
import { SourceMapConsumer } from 'source-map';
import { EngineBase } from '../engine/EngineBase';
import { TranspiledModule } from '../engine/TranspiledModule';
import { getLinesAround } from './getLinesAround';
import { getSourceMap, SourceMap } from './getSourceMap';
import { StackFrame } from './StackFrame';

/**
 * Enhances a set of <code>StackFrame</code>s with their original positions and code (when available).
 */
export async function map(
  engine: EngineBase,
  frames: ReadonlyArray<StackFrame>,
  contextLines = 3,
): Promise<ReadonlyArray<StackFrame>> {
  initializeSourceMap();
  const mutableCache: { [fileName: string]: { fileSource: string; map: SourceMap } | undefined } = {};
  const mutableFiles: string[] = [];
  frames.forEach((frame) => {
    const { fileName } = frame;
    if (fileName === undefined) {
      return;
    }
    if (mutableFiles.indexOf(fileName) !== -1) {
      return;
    }
    mutableFiles.push(fileName);
  });
  await Promise.all(
    mutableFiles.map(async (fileName) => {
      const mod = engine.tryGetModule(
        fileName.startsWith('http')
          ? fileName
              .split('/')
              .slice(3)
              .join('/')
          : fileName,
      );
      if (mod !== undefined && mod instanceof TranspiledModule) {
        const consumer = await new SourceMapConsumer(mod.sourceMap);
        const sourceMap = new SourceMap(consumer);

        mutableCache[fileName] = { fileSource: mod.code, map: sourceMap };
      } else {
        try {
          const fetchUrl =
            fileName.indexOf('webpack-internal:') === 0
              ? `/__get-internal-source?fileName=${encodeURIComponent(fileName)}`
              : fileName;

          const fileSource = await fetch(fetchUrl).then(async (r) => r.text());
          const sourceMap = await getSourceMap(fileName, fileSource);
          mutableCache[fileName] = { fileSource, map: sourceMap };
        } catch (error) {
          // tslint:disable-next-line no-console
          console.error(error);
        }
      }
    }),
  );

  const mappedFrames = frames.map((frame) => {
    const { functionName, fileName, lineNumber, columnNumber } = frame;
    if (fileName === undefined) {
      return frame;
    }

    const value = mutableCache[fileName];
    if (value === undefined) {
      return frame;
    }

    const { map: sourceMap, fileSource } = value;
    if (lineNumber === undefined || columnNumber === undefined) {
      return frame;
    }
    const { name, source, line, column } = sourceMap.getOriginalPosition(lineNumber, columnNumber);
    if (source === undefined || line === undefined) {
      return frame;
    }

    const originalSource = sourceMap.getSource(source);
    if (originalSource === undefined) {
      return frame;
    }

    return new StackFrame(
      functionName,
      fileName,
      lineNumber,
      columnNumber,
      getLinesAround(lineNumber, contextLines, fileSource),
      name,
      source,
      line,
      column,
      getLinesAround(line, contextLines, originalSource),
    );
  });

  Object.values(mutableCache).forEach((value) => {
    if (value !== undefined) {
      value.map.destroy();
    }
  });

  return mappedFrames;
}
