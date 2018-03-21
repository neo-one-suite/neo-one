/* @flow */
import { type CLIArgs, paths } from '@neo-one/server-plugin';

import boa from '@neo-one/boa';
import execa from 'execa';

export default ({ vorpal, shutdown, logConfig$ }: CLIArgs) => {
  vorpal
    .command(
      'compile python <file> <output>',
      'Compile Python code into a smart contract. Expects a py file.',
    )
    .action(async args => {
      const { file, output } = args;

      logConfig$.next({
        name: 'compile-python',
        path: paths.log,
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      });

      try {
        await execa(boa, [file, output]);
      } catch (error) {
        process.stdout.write(error.message);
        shutdown({ exitCode: 1, error });
        return;
      }

      shutdown({ exitCode: 0 });
    });
};
