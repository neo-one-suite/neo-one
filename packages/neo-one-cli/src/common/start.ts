import { Configuration } from '@neo-one/cli-common';
import { loadConfiguration } from '@neo-one/cli-common-node';
import { cliLogger } from '@neo-one/logger';
import { Disposable } from '@neo-one/utils';
import { createStart, StartReturn } from '@neo-one/utils-node';
import { Command } from '../types';

type StartFunc = (cmd: Command, config: Configuration) => Promise<StartReturn | Disposable | number | undefined | void>;

const startInternal = createStart(cliLogger);

export const start = (startFunc: StartFunc, optionalConfigPath?: string) => {
  // tslint:disable-next-line no-object-mutation
  cliLogger.level = 'info';

  startInternal(async () => {
    const config = await loadConfiguration(optionalConfigPath);

    const cmd = {
      bin: process.argv[0],
      args: [process.argv[1]],
    };

    return startFunc(cmd, config);
  });
};
