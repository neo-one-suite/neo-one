import { RawAction } from '@neo-one/client-core';
import { createConsoleLogMessages as createConsoleLogMessagesBase, LogOptions, SourceMaps } from '../common';

export const createConsoleLogMessages = async (
  actions: ReadonlyArray<RawAction>,
  sourceMaps: Promise<SourceMaps>,
  options: LogOptions,
): Promise<ReadonlyArray<string>> => createConsoleLogMessagesBase(actions, sourceMaps, options);
