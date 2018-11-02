import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import * as fs from 'fs-extra';
import * as path from 'path';
import { loadProjectConfig } from './utils';

export const initCommand = ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal.command('init', 'Initialize neo-one in the current directory.').action(async () => {
    const projectConfig = await loadProjectConfig(process.cwd());
    const tsconfigPath = path.resolve(projectConfig.paths.contracts, 'tsconfig.json');
    const contractsPath = path.dirname(tsconfigPath);

    await fs.ensureDir(contractsPath);
    await fs.writeFile(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            ...COMPILER_OPTIONS,
            plugins: [
              {
                name: '@neo-one/smart-contract-typescript-plugin',
              },
            ],
          },
        },
        // tslint:disable-next-line:no-null-keyword
        null,
        2,
      ),
    );
    cli.print(`Created tsconfig.json at ${tsconfigPath}.`);

    cli.print(
      `If you're using TypeScript in your project, make sure to add the NEO•ONE contracts directory (${contractsPath}) to the "exclude" section of your root tsconfig.`,
    );
  });
