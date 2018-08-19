import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { ProcessTraceOptions, ProcessTraceResult } from '../common';
import { getChunk } from './utils';

export const processTrace = async ({
  trace,
  sourceMaps,
}: ProcessTraceOptions): Promise<ReadonlyArray<ProcessTraceResult | undefined>> => {
  if (sourceMaps === undefined) {
    return trace.map(() => undefined);
  }

  async function withSourceMaps(
    consumers: { [address: string]: SourceMapConsumer | undefined },
    remainingSourceMaps: ReadonlyArray<[string, RawSourceMap]>,
  ): Promise<ReadonlyArray<ProcessTraceResult | undefined>> {
    if (remainingSourceMaps.length === 0) {
      const mutableTraceLines: Array<ProcessTraceResult | undefined> = [];
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
          file: source,
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
