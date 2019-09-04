import { RawAction } from '@neo-one/client-common';
import { createConsoleLogMessages as createConsoleLogMessagesBase, LogOptions, SourceMaps } from '../common';

export const createConsoleLogMessages = async (
  actions: readonly RawAction[],
  sourceMaps: SourceMaps,
  options: LogOptions,
): Promise<readonly string[]> => {
  if (process.env.NODE_ENV === 'production' && process.env.NEO_ONE_DEV !== 'true') {
    return [];
  }

  return createConsoleLogMessagesBase(actions, sourceMaps, options);
};
