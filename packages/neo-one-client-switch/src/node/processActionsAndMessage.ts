import { RawAction } from '@neo-one/client-core';
import { SourceMaps } from '../common';
import { createConsoleLogMessages } from './createConsoleLogMessages';
import { extractErrorTrace } from './extractErrorTrace';
import { processError } from './processError';

export const processActionsAndMessage = async ({
  actions,
  message: messageIn,
  sourceMaps,
}: {
  readonly actions: ReadonlyArray<RawAction>;
  readonly message: string;
  readonly sourceMaps?: SourceMaps;
}): Promise<string> => {
  const [message, logs] = await Promise.all([
    processError({
      ...extractErrorTrace(actions),
      message: messageIn,
      sourceMaps,
    }),
    createConsoleLogMessages(actions, sourceMaps),
  ]);
  const logMessage = logs.length === 0 ? '' : `\n${logs.join('\n\n')}`;

  return `${message}${logMessage}`;
};
