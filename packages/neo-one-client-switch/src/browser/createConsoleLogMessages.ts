import { RawAction } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';
import { LogOptions } from '../common';

export const createConsoleLogMessages = async (
  _actions: ReadonlyArray<RawAction>,
  _sourceMap: RawSourceMap,
  _options: LogOptions = { bare: false },
): Promise<ReadonlyArray<string>> => [];
