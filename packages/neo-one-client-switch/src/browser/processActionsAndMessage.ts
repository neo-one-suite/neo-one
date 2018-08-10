import { ActionRaw } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';

export const processActionsAndMessage = async ({
  message,
}: {
  readonly actions: ReadonlyArray<ActionRaw>;
  readonly message: string;
  readonly sourceMap?: RawSourceMap;
}): Promise<string> => message;
