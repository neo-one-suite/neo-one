import { SourceMapConsumer } from 'source-map';
import { ProcessTraceOptions, ProcessTraceResult } from '../common';
import { getChunk } from './utils';

export const processTrace = async ({
  trace,
  sourceMap,
}: ProcessTraceOptions): Promise<ReadonlyArray<ProcessTraceResult | undefined>> =>
  sourceMap === undefined
    ? trace.map(() => undefined)
    : SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
        const mutableTraceLines: Array<ProcessTraceResult | undefined> = [];
        // tslint:disable-next-line no-loop-statement
        for (const { line: lineNumber } of trace) {
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
            file: source,
            token: sourceValue,
            column: column === null ? undefined : column,
          });
        }

        return mutableTraceLines;
      });
