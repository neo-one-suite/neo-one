// tslint:disable no-console
import { Configuration } from '@neo-one/cli-common';
import { createDefaultConfigurationJavaScript, createDefaultConfigurationTypeScript } from '@neo-one/cli-common-node';
import { COMPILER_OPTIONS } from '@neo-one/smart-contract-compiler';
import { normalizePath } from '@neo-one/utils';
import { Yarguments } from '@neo-one/utils-node';
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
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .boolean('react')
    .describe('react', 'Generate an example react component that uses the HelloWorld smart contract.')
    .default('react', false);
export const handler = (argv: Yarguments<ReturnType<typeof builder>>) => {
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

    const helloWorldPath = nodePath.resolve(config.contracts.path, 'HelloWorld.ts');
    const helloWorldContents = `import { createEventNotifier, SmartContract } from '@neo-one/smart-contract';

const hello = createEventNotifier<string>('hello', 'name');

export class HelloWorld extends SmartContract {
  public hello(name: string): string {
    const value = \`Hello \${name}!\`;

    hello(value);

    return value;
  }
}
`;

    const helloWorldTestPath = nodePath.resolve(
      config.codegen.path,
      '..',
      '__tests__',
      `HelloWorld.test.${config.codegen.language === 'typescript' ? 'ts' : 'js'}`,
    );
    const helloWorldTestContents = `import { withContracts } from "../${nodePath.basename(config.codegen.path)}/test";

describe('HelloWorld', () => {
  it('responds with the given name', async () => {
    await withContracts(async ({ helloWorld }) => {
      const receipt = await helloWorld.hello.confirmed('Foo');
      if (receipt.result.state === 'FAULT') {
        throw new Error(receipt.result.message);
      }

      expect(receipt.result.value).toEqual('Hello Foo!');
      expect(receipt.events).toHaveLength(1);
      expect(receipt.events[0].parameters.name).toEqual('Hello Foo!');
    });
  });
});
`;

    const reactPath = nodePath.resolve(
      config.codegen.path,
      '..',
      `ExampleHelloWorld.${config.codegen.language === 'typescript' ? 'tsx' : 'jsx'}`,
    );
    const reactContents = `import React, { useCallback, useState } from 'react';
import { useContracts } from './${nodePath.basename(config.codegen.path)}';

export const ExampleHelloWorld = () => {
  const { helloWorld } = useContracts();
  const [name, setName] = useState('World');
  const [response, setResponse] = useState('Hello World!');

  const onChangeInput = useCallback((event${
    config.codegen.language === 'typescript' ? ': React.ChangeEvent<HTMLInputElement>' : ''
  }) => {
    setName(event.target.value);
  }, [name]);

  const onSubmit = useCallback(() => {
    helloWorld.hello.confirmed(name)
      .then((receipt) => {
        if (receipt.result.state === 'FAULT') {
          throw new Error(receipt.result.message);
        }

        setResponse(receipt.result.value);
      })
      .catch((err) => {
        setResponse(err.name);
      })
  }, [name, helloWorld]);

  return (
    <div>
      <input type="text" value={name} onChange={onChangeInput}/>
      <input type="button" value="Submit" onClick={onSubmit}/>
      <div>{response}</div>
    </div>
  );
}
`;

    const rootTSConfigPath = nodePath.resolve(process.cwd(), 'tsconfig.json');
    const rootTSConfigContents = await fs.readFile(rootTSConfigPath, 'utf8').catch((err) => {
      if (err.code === 'ENOENT') {
        return;
      }

      throw err;
    });

    await Promise.all([
      writeFile(tsconfigPath, JSON.stringify(tsconfig, undefined, 2)),
      writeFile(helloWorldPath, helloWorldContents),
      writeFile(helloWorldTestPath, helloWorldTestContents),
      handleConfig(config, rootTSConfigContents === undefined),
      argv.react ? writeFile(reactPath, reactContents) : Promise.resolve(),
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

    console.log(
      'NEO•ONE initialized, run `neo-one build` to deploy the HelloWorld smart contract to a local development network.',
    );
  });
};
