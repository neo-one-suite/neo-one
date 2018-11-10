import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import { normalizePath } from '@neo-one/utils';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import jsonFile from 'json-file-plus';
import * as path from 'path';
import { loadProjectConfig } from './utils';

export const initCommand = ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal.command('init', 'Initialize neo-one in the current directory.').action(async () => {
    const cwd = process.cwd();
    const projectConfig = await loadProjectConfig(cwd);
    const tsconfigPath = path.resolve(projectConfig.paths.contracts, 'tsconfig.json');
    const contractsPath = path.dirname(tsconfigPath);

    await fs.ensureDir(contractsPath);
    await fs.writeFile(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            ...COMPILER_OPTIONS,
            target: 'esnext',
            module: 'esnext',
            moduleResolution: 'node',
            jsx: 'react',
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
    const rootTsConfigPath = path.resolve(cwd, 'tsconfig.json');
    const exists = await fs.pathExists(rootTsConfigPath);
    if (exists) {
      const file = await jsonFile(rootTsConfigPath);
      const currentExcludeIn = await file.get('exclude');
      const currentExclude = currentExcludeIn === undefined ? [] : currentExcludeIn;
      file.set({
        exclude: currentExclude.concat([
          normalizePath(path.relative(cwd, path.join(projectConfig.paths.contracts, '*.ts'))),
        ]),
      });
      await file.save();
      cli.print('Added contracts directory to root tsconfig exclude.');
    } else {
      cli.print(
        `Did not find root tsconfig. If you add TypeScript to your project, make sure to add the NEO•ONE contracts directory (${contractsPath}) to the "exclude" section of your root tsconfig.`,
      );
    }
  });
