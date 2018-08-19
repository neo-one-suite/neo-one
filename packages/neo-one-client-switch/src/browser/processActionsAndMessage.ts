import { RawAction } from '@neo-one/client-core';
import { SourceMaps } from '../common';

export const processActionsAndMessage = async ({
  message,
}: {
  readonly actions: ReadonlyArray<RawAction>;
  readonly message: string;
  readonly sourceMaps?: SourceMaps;
}): Promise<string> => message;
