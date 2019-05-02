import { RawAction } from '@neo-one/client-common';
import { createConsoleLogMessages as createConsoleLogMessagesBase, LogOptions, SourceMaps } from '../common';

export const createConsoleLogMessages = async (
  actions: readonly RawAction[],
  sourceMaps: Promise<SourceMaps>,
  options: LogOptions,
): Promise<readonly string[]> => createConsoleLogMessagesBase(actions, sourceMaps, options);
