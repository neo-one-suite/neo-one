import { InteractiveCLIArgs } from '@neo-one/server-plugin';
import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import { normalizePath } from '@neo-one/utils';
import * as fs from 'fs-extra';
// tslint:disable-next-line match-default-export-name
import jsonFile from 'json-file-plus';
import * as path from 'path';
import { loadProjectConfig } from './utils';

interface InitDataFileOpts {
  readonly folder: string;
  readonly name: string;
  // tslint:disable-next-line:no-any
  readonly data: string;
  readonly cli: InteractiveCLIArgs['cli'];
}
export const initDataFile = async ({ folder, name, data, cli }: InitDataFileOpts) => {
  const filePath = path.resolve(folder, name);
  await fs.ensureDir(folder);
  const createdUpdated = fs.existsSync(filePath) ? 'updated' : 'created';
  await fs.writeFile(
    filePath,
    JSON.stringify(
      JSON.parse(data),
      // tslint:disable-next-line:no-null-keyword
      null,
      2,
    ),
  );
  cli.print(`${createdUpdated} ${name} at ${filePath}.`);
};

export const initCommand = ({ cli }: InteractiveCLIArgs) =>
  cli.vorpal.command('init', 'Initialize neo-one in the current directory.').action(async () => {
    const cwd = process.cwd();
    const projectConfig = await loadProjectConfig(cwd);
    const relativeConfig = {
      ...projectConfig,
      paths: {
        ...projectConfig.paths,
        contracts: path.relative(process.cwd(), projectConfig.paths.contracts),
        generated: path.relative(process.cwd(), projectConfig.paths.generated),
      },
    };
    const tsconfigPath = path.resolve(relativeConfig.paths.contracts, 'tsconfig.json');
    const contractsPath = path.dirname(tsconfigPath);

    const tsData = {
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
    };

    await Promise.all([
      initDataFile({ folder: projectConfig.paths.contracts, name: 'tsconfig.json', data: JSON.stringify(tsData), cli }),
      initDataFile({ folder: cwd, name: '.onerc', data: JSON.stringify(relativeConfig), cli }),
    ]);

    if (projectConfig.codegen.framework === 'none') {
      cli.print('Unable to determine project framework, please specify it in .onerc');
    }

    const rootTsConfigPath = path.resolve(cwd, 'tsconfig.json');
    const exists = await fs.pathExists(rootTsConfigPath);
    if (exists) {
      const file = await jsonFile(rootTsConfigPath);
      const currentExcludeIn = await file.get('exclude');
      const currentExclude = new Set<string>(currentExcludeIn);
      file.set({
        exclude: [
          ...currentExclude.add(normalizePath(path.relative(cwd, path.join(projectConfig.paths.contracts, '*.ts')))),
        ],
      });
      await file.save();
      cli.print('Added contracts directory to root tsconfig exclude.');
    } else {
      cli.print(
        `Did not find root tsconfig. If you add TypeScript to your project, make sure to add the NEO•ONE contracts directory (${contractsPath}) to the "exclude" section of your root tsconfig.`,
      );
    }
  });
