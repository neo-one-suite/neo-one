import { RawAction } from '@neo-one/client-common';
import { SourceMaps } from '../common';
import { createConsoleLogMessages } from './createConsoleLogMessages';

export interface ProcessConsoleLogOptions {
  readonly actions: readonly RawAction[];
  readonly sourceMaps?: SourceMaps;
}

// tslint:disable-next-line no-let
let disabled = false;
export const disableConsoleLogForTest = () => {
  disabled = true;
};

export const enableConsoleLogForTest = () => {
  disabled = false;
};

export const processConsoleLogMessages = async ({ actions, sourceMaps }: ProcessConsoleLogOptions): Promise<void> => {
  if (!disabled) {
    const logs = await createConsoleLogMessages(actions, sourceMaps);
    if (logs.length > 0) {
      // tslint:disable-next-line no-console
      console.log(logs.join('\n\n'));
    }
  }
};
