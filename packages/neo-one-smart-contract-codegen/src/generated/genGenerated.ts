import { CodegenFramework } from '@neo-one/cli-common';
import _ from 'lodash';
import { ContractPaths } from '../type';
import { getRelativeImport } from '../utils';

const createExport = (generatedPath: string, importPath: string) =>
  `export * from '${getRelativeImport(generatedPath, importPath)}';`;

const createNewLineExport = (generatedPath: string, importPath: string) =>
  `\n${createExport(generatedPath, importPath)}`;

export const genGenerated = ({
  contractsPaths,
  contractsPath,
  reactPath,
  angularPath,
  vuePath,
  clientPath,
  generatedPath,
  framework,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly contractsPath: string;
  readonly reactPath: string;
  readonly angularPath: string;
  readonly vuePath: string;
  readonly clientPath: string;
  readonly generatedPath: string;
  readonly framework: CodegenFramework;
}) => ({
  ts: `
${createExport(generatedPath, contractsPath)}${
    framework === 'react' ? createNewLineExport(generatedPath, reactPath) : ''
  }${framework === 'angular' ? createNewLineExport(generatedPath, angularPath) : ''}${
    framework === 'vue' ? createNewLineExport(generatedPath, vuePath) : ''
  }
${createExport(generatedPath, clientPath)}
${_.flatMap(contractsPaths, ({ createContractPath, typesPath, abiPath }) => [createContractPath, typesPath, abiPath])
  .map((importPath) => createExport(generatedPath, importPath))
  .join('\n')}
`,
  js: `
${framework === 'react' ? createNewLineExport(generatedPath, reactPath) : ''}${
    framework === 'angular' ? createNewLineExport(generatedPath, angularPath) : ''
  }${framework === 'vue' ? createNewLineExport(generatedPath, vuePath) : ''}
${createExport(generatedPath, clientPath)}
${_.flatMap(contractsPaths, ({ createContractPath, abiPath }) => [createContractPath, abiPath])
  .map((importPath) => createExport(generatedPath, importPath))
  .join('\n')}
`,
});
