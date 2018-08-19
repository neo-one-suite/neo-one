import { RawAction } from '@neo-one/client-core';
import { LogOptions, SourceMaps } from '../common';

export const createConsoleLogMessages = async (
  _actions: ReadonlyArray<RawAction>,
  _sourceMap: SourceMaps,
  _options: LogOptions = { bare: false },
): Promise<ReadonlyArray<string>> => [];
