// tslint:disable no-console
import { Configuration } from '@neo-one/cli-common';
import { createDefaultConfigurationJavaScript, createDefaultConfigurationTypeScript } from '@neo-one/cli-common-node';
import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import { normalizePath } from '@neo-one/utils';
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

const handleConfig = async (config: Configuration, useJavaScript: boolean) => {
  const configPath = nodePath.resolve(process.cwd(), useJavaScript ? '.neo-one.config.js' : '.neo-one.config.ts');
  const exists = await fs.pathExists(configPath);
  if (!exists) {
    await fs.writeFile(
      configPath,
      useJavaScript ? createDefaultConfigurationJavaScript(config) : createDefaultConfigurationTypeScript(config),
    );
    console.log(`Created ${nodePath.relative(process.cwd(), configPath)}.`);
  }
};

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

    const rootTSConfigPath = nodePath.resolve(process.cwd(), 'tsconfig.json');
    const rootTSConfigContents = await fs.readFile(rootTSConfigPath, 'utf8').catch((err) => {
      if (err.code === 'ENOENT') {
        return;
      }

      throw err;
    });

    await Promise.all([
      writeFile(tsconfigPath, JSON.stringify(tsconfig, undefined, 2)),
      handleConfig(config, rootTSConfigContents === undefined),
    ]);

    if (rootTSConfigContents) {
      const rootTSConfig = JSON.parse(rootTSConfigContents);
      const exclude = rootTSConfig.exclude === undefined ? [] : rootTSConfig.exclude;
      const excludePath = normalizePath(nodePath.relative(process.cwd(), nodePath.join(config.contracts.path, '*.ts')));
      if (!new Set(exclude).has(excludePath)) {
        await writeFile(
          rootTSConfigPath,
          JSON.stringify(
            {
              ...rootTSConfig,
              exclude: [...exclude, excludePath],
            },
            undefined,
            2,
          ),
        );
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
