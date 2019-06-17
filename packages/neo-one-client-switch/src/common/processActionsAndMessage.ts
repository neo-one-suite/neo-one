import { RawAction } from '@neo-one/client-common';
import { RawSourceMap } from 'source-map';
import { processConsoleLogMessages } from '../node/processConsoleLogMessages';
import { extractErrorTrace } from './extractErrorTrace';
import { processError } from './processError';

export interface SourceMaps {
  readonly [address: string]: RawSourceMap;
}

export interface ProcessActionsAndMessageOptions {
  readonly actions: readonly RawAction[];
  readonly message: string;
  readonly sourceMaps?: Promise<SourceMaps>;
}

export const processActionsAndMessage = async ({
  actions,
  message: messageIn,
  sourceMaps: sourceMapsIn,
}: ProcessActionsAndMessageOptions): Promise<string> => {
  const sourceMaps = await sourceMapsIn;
  const [message] = await Promise.all([
    processError({
      ...extractErrorTrace(actions),
      message: messageIn,
      sourceMaps,
    }),
    processConsoleLogMessages({ actions, sourceMaps: sourceMapsIn }),
  ]);

  return message;
};
