/* @flow */
import { type CLIArgs, paths } from '@neo-one/server-plugin';

import csharp from '@neo-one/csharp';
import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';

export default ({ vorpal, shutdown, logConfig$ }: CLIArgs) => {
  vorpal
    .command(
      'compile csharp <file> <output>',
      'Compile C# code into a smart contract. Expects a dll file.',
    )
    .action(async args => {
      const { file, output } = args;

      logConfig$.next({
        name: 'compile-csharp',
        path: paths.log,
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      });

      try {
        await execa(csharp, [file]);
      } catch (error) {
        process.stdout.write(error.message);
        shutdown({ exitCode: 1, error });
        return;
      }

      try {
        const outputPath = path.basename(file.replace('.dll', '.avm'));
        await fs.move(outputPath, output);
      } catch (error) {
        process.stdout.write(error.message);
        shutdown({ exitCode: 1, error });
        return;
      }

      try {
        const abiPath = path.basename(file.replace('.dll', '.abi.json'));
        await fs.remove(abiPath);
      } catch (error) {
        process.stdout.write(error.message);
        shutdown({ exitCode: 1, error });
        return;
      }

      shutdown({ exitCode: 0 });
    });
};
