import { RawAction } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';
import { createConsoleLogMessages } from './createConsoleLogMessages';
import { extractErrorTrace } from './extractErrorTrace';
import { processError } from './processError';

export const processActionsAndMessage = async ({
  actions,
  message: messageIn,
  sourceMap,
}: {
  readonly actions: ReadonlyArray<RawAction>;
  readonly message: string;
  readonly sourceMap?: RawSourceMap;
}): Promise<string> => {
  const [message, logs] = await Promise.all([
    processError({
      ...extractErrorTrace(actions),
      message: messageIn,
      sourceMap,
    }),
    sourceMap === undefined ? [] : createConsoleLogMessages(actions, sourceMap),
  ]);
  const logMessage = logs.length === 0 ? '' : `\n${logs.join('\n\n')}`;

  return `${message}${logMessage}`;
};
