import * as path from 'path';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { SourceMaps } from './processActionsAndMessage';
import { getChunk } from './utils';

export interface ProcessTraceTrace {
  readonly address: string;
  readonly line: number;
}

export interface ProcessTraceResult {
  readonly line: number;
  readonly column: number | undefined;
  readonly file: string;
  readonly token: string;
}

export interface ProcessTraceOptions {
  readonly trace: readonly ProcessTraceTrace[];
  readonly sourceMaps?: SourceMaps;
  readonly onlyFileName?: boolean;
}

export const processTrace = async ({
  trace,
  sourceMaps,
  onlyFileName,
}: ProcessTraceOptions): Promise<readonly (ProcessTraceResult | undefined)[]> => {
  if (sourceMaps === undefined) {
    return trace.map(() => undefined);
  }

  async function withSourceMaps(
    consumers: { [address: string]: SourceMapConsumer | undefined },
    remainingSourceMaps: readonly (readonly [string, RawSourceMap])[],
  ): Promise<readonly (ProcessTraceResult | undefined)[]> {
    if (remainingSourceMaps.length === 0) {
      const mutableTraceLines: (ProcessTraceResult | undefined)[] = [];
      // tslint:disable-next-line no-loop-statement
      for (const { line: lineNumber, address } of trace) {
        const consumer = consumers[address];
        if (consumer === undefined) {
          mutableTraceLines.push(undefined);

          continue;
        }

        const { source, line, column } = consumer.originalPositionFor({ line: lineNumber, column: 0 });
        if (source === null || line === null) {
          mutableTraceLines.push(undefined);

          continue;
        }

        const sourceContent = consumer.sourceContentFor(source, true);
        let sourceValue: string | undefined;
        if (sourceContent !== null && column !== null) {
          const sourceLine = sourceContent.split('\n')[line - 1] as string | undefined;
          if (sourceLine !== undefined) {
            sourceValue = getChunk(sourceLine.slice(column));
          }
        }

        if (sourceValue === undefined || sourceValue.trim() === '') {
          sourceValue = 'unknown';
        }

        mutableTraceLines.push({
          line,
          file: onlyFileName ? path.basename(source) : source,
          token: sourceValue,
          column: column === null ? undefined : column,
        });
      }

      return mutableTraceLines;
    }

    const [currentAddress, currentSourceMap] = remainingSourceMaps[0];

    return SourceMapConsumer.with(currentSourceMap, undefined, async (consumer) =>
      withSourceMaps(
        {
          ...consumers,
          [currentAddress]: consumer,
        },
        remainingSourceMaps.slice(1),
      ),
    );
  }

  return withSourceMaps({}, Object.entries(sourceMaps));
};
