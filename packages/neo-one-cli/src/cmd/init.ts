import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import { Configuration, normalizePath } from '@neo-one/utils';
import * as fs from 'fs-extra';
import * as nodePath from 'path';
import yargs from 'yargs';
import { start } from '../common';

const writeFile = async (filePath: string, contents: string) => {
  const [exists] = await Promise.all([fs.pathExists(filePath), fs.ensureDir(nodePath.dirname(filePath))]);

  await fs.writeFile(filePath, contents);

  const createdUpdated = exists ? 'Updated' : 'Created';
  console.log(`${createdUpdated} ${nodePath.relative(process.cwd(), filePath)}.`);
};

const relativizePaths = (config: Configuration) => ({
  ...config,
  contracts: {
    ...config.contracts,
    path: nodePath.relative(process.cwd(), config.contracts.path),
  },
  codegen: {
    ...config.codegen,
    path: nodePath.relative(process.cwd(), config.codegen.path),
  },
  network: {
    ...config.network,
    path: nodePath.relative(process.cwd(), config.network.path),
  },
  neotracker: {
    ...config.neotracker,
    path: nodePath.relative(process.cwd(), config.neotracker.path),
  },
});

export const command = 'init';
export const describe = 'Initializes a new project in the current directory.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async (_cmd, config) => {
    const tsconfigPath = nodePath.resolve(config.contracts.path, 'tsconfig.json');
    const tsconfig = {
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

    const configPath = nodePath.resolve(process.cwd(), '.neo-onerc');
    const rootTSConfigPath = nodePath.resolve(process.cwd(), 'tsconfig.json');

    const [contents] = await Promise.all([
      fs.readFile(rootTSConfigPath, 'utf8').catch((err) => {
        if (err.code === 'ENOENT') {
          return undefined;
        }

        throw err;
      }),
      writeFile(tsconfigPath, JSON.stringify(tsconfig, undefined, 2)),
      writeFile(configPath, JSON.stringify(relativizePaths(config), undefined, 2)),
    ]);

    if (contents) {
      const rootTSConfig = JSON.parse(contents);
      const exclude = rootTSConfig.exclude === undefined ? [] : rootTSConfig.exclude;
      const excludePath = normalizePath(nodePath.relative(process.cwd(), nodePath.join(config.contracts.path, '*.ts')));
      if (!new Set(exclude).has(excludePath)) {
        await writeFile(rootTSConfigPath, {
          ...rootTSConfig,
          exclude: [...exclude, excludePath],
        });
      }
    } else {
      console.log(
        `Did not find root tsconfig. If you add TypeScript to your project, make sure to add the NEO•ONE contracts directory (${nodePath.relative(
          process.cwd(),
          nodePath.dirname(tsconfigPath),
        )}) to the "exclude" section of your root tsconfig.`,
      );
    }
  });
};
