import { RawAction } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';
import { processConsoleLogMessages } from '../node/processConsoleLogMessages';
import { extractErrorTrace } from './extractErrorTrace';
import { processError } from './processError';

export interface SourceMaps {
  readonly [address: string]: RawSourceMap;
}

export interface ProcessActionsAndMessageOptions {
  readonly actions: ReadonlyArray<RawAction>;
  readonly message: string;
  readonly sourceMaps?: SourceMaps;
}

export const processActionsAndMessage = async ({
  actions,
  message: messageIn,
  sourceMaps,
}: ProcessActionsAndMessageOptions): Promise<string> => {
  const [message] = await Promise.all([
    processError({
      ...extractErrorTrace(actions),
      message: messageIn,
      sourceMaps,
    }),
    processConsoleLogMessages({ actions, sourceMaps }),
  ]);

  return message;
};
