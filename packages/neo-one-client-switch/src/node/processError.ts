import { codeFrameColumns } from '@babel/code-frame';
import { RawSourceMap, SourceMapConsumer } from 'source-map';
import { ProcessErrorError, ProcessErrorOptions, ProcessErrorTrace } from '../common';

const MESSAGE_INDENT = '  ';

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

const processGenericError = async (message: string, sourceMap: RawSourceMap): Promise<string> =>
  SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
    const mutableMessage = message.trim().split('\n');
    const line = mutableMessage.find((splitLine) => splitLine.startsWith('Line:'));
    if (line !== undefined) {
      const lineIndex = mutableMessage.indexOf(line);
      if (lineIndex === -1) {
        return message;
      }

      const lineNumber = parseInt(line.split(':')[1], 10);
      const positionMessage = getSourceMapPosition({ lineNumber, consumer });
      if (positionMessage === undefined) {
        return message;
      }

      mutableMessage[lineIndex] = `\n${positionMessage}\n`;

      return mutableMessage
        .filter((splitLine) => !splitLine.startsWith('Line:') && !splitLine.startsWith('PC:'))
        .join('\n');
    }

    return message;
  });

const KEYWORDS = new Set(['public', 'private', 'protected', 'throw', 'const', 'let', 'function', 'readonly', 'new']);

const getChunk = (line: string) => {
  const mutableChunks: string[] = [];
  let current = '';

  // tslint:disable-next-line no-loop-statement
  for (const char of line) {
    if (char === ' ') {
      if (KEYWORDS.has(current)) {
        mutableChunks.push(current);
        current = '';
      } else if (mutableChunks.length > 0) {
        break;
      }
    } else if (char === '(') {
      break;
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    mutableChunks.push(current);
  }

  return mutableChunks.join(' ');
};

const processTraceError = async (
  message: string,
  error: ProcessErrorError,
  trace: ReadonlyArray<ProcessErrorTrace>,
  sourceMap: RawSourceMap,
): Promise<string> =>
  SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
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

    return `Error: ${error.message}\n${positionMessage}${mutableTraceLines.join('\n')}`;
  });

export const processError = async ({ message, error, trace, sourceMap }: ProcessErrorOptions): Promise<string> => {
  if (sourceMap === undefined) {
    return message;
  }

  if (error === undefined) {
    return processGenericError(message, sourceMap);
  }

  return processTraceError(message, error, trace, sourceMap);
};
