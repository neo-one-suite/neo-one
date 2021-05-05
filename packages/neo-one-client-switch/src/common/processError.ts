import { codeFrameColumns } from '@babel/code-frame';
import { scriptHashToAddress } from '@neo-one/client-common';
import _ from 'lodash';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { initializeSourceMap } from '../node';
import { SourceMaps } from './processActionsAndMessage';
import { getChunk } from './utils';

export interface ProcessErrorError {
  readonly address: string;
  readonly line: number;
  readonly message: string;
}

export interface ProcessErrorTrace {
  readonly address: string;
  readonly line: number;
}

export interface ProcessErrorOptions {
  readonly message: string;
  readonly error?: ProcessErrorError;
  readonly trace?: readonly ProcessErrorTrace[];
  readonly sourceMaps?: SourceMaps;
}

const CALLSITE_INDENT = '    ';
const MESSAGE_INDENT = `${CALLSITE_INDENT}  `;

const getRenderedCallsite = (fileContent: string, line: number, column?: number) => {
  let renderedCallsite = codeFrameColumns(fileContent, { start: { column, line } }, { highlightCode: true });

  renderedCallsite = renderedCallsite
    .split('\n')
    .map((renderedLine: string) => MESSAGE_INDENT + renderedLine)
    .join('\n');

  renderedCallsite = `\n${renderedCallsite}\n`;

  return renderedCallsite;
};

const getSourceMapPosition = ({
  lineNumber,
  consumer,
}: {
  readonly lineNumber: number;
  readonly consumer: SourceMapConsumer;
}): string | undefined => {
  const { source, line, column } = consumer.originalPositionFor({ line: lineNumber, column: 0 });
  if (source === null || line === null) {
    return undefined;
  }

  const sourceContent = consumer.sourceContentFor(source, true);
  if (sourceContent === null) {
    return undefined;
  }

  return getRenderedCallsite(sourceContent, line, column === null ? undefined : column + 1);
};

const processGenericError = async (message: string, sourceMaps: SourceMaps): Promise<string> => {
  const mutableMessage = message.trim().split('\n');
  const scriptHash = mutableMessage.find((splitLine) => splitLine.startsWith('Script Hash:'));
  let address: string | undefined;
  if (scriptHash !== undefined) {
    address = scriptHashToAddress(scriptHash.split(':')[1]);
  }

  let sourceMap = Object.values(sourceMaps)[0];
  if (address !== undefined && (sourceMaps[address] as RawSourceMap | undefined) !== undefined) {
    sourceMap = sourceMaps[address];
  }

  const line = mutableMessage.find((splitLine) => splitLine.startsWith('Line:'));
  if (line === undefined) {
    return message;
  }

  initializeSourceMap();

  return SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
    const lineNumber = parseInt(line.split(':')[1], 10);
    const positionMessage = getSourceMapPosition({ lineNumber, consumer });
    if (positionMessage === undefined) {
      return message;
    }

    return `${mutableMessage[0]}\n${positionMessage}\n\n`;
  });
};

const processTraceError = async (
  message: string,
  error: ProcessErrorError,
  trace: readonly ProcessErrorTrace[],
  sourceMaps: SourceMaps,
): Promise<string> => {
  let sourceMap = Object.values(sourceMaps)[0];
  if ((sourceMaps[error.address] as RawSourceMap | undefined) !== undefined) {
    sourceMap = sourceMaps[error.address];
  }

  initializeSourceMap();

  return SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
    const positionMessage = getSourceMapPosition({ lineNumber: error.line, consumer });
    if (positionMessage === undefined) {
      return message;
    }

    const mutableTraceLines: string[] = [];
    // tslint:disable-next-line no-loop-statement
    for (const { line: lineNumber } of trace) {
      const { source, line, column } = consumer.originalPositionFor({ line: lineNumber, column: 0 });
      if (source === null || line === null) {
        return message;
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

      mutableTraceLines.push(
        `${MESSAGE_INDENT}at ${sourceValue} (${source}:${line}${column === null ? '' : `:${column}`})`,
      );
    }

    return `${error.message}\n${positionMessage}${mutableTraceLines.join('\n')}`;
  });
};

export const processError = async ({
  message,
  error,
  trace = [],
  sourceMaps,
}: ProcessErrorOptions): Promise<string> => {
  if (sourceMaps === undefined || _.isEmpty(sourceMaps)) {
    return message;
  }

  if (error === undefined) {
    return processGenericError(message, sourceMaps);
  }

  return processTraceError(message, error, trace, sourceMaps);
};
