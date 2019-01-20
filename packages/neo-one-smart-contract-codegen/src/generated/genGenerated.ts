import _ from 'lodash';
import { ContractPaths } from '../type';
import { getRelativeImport } from '../utils';

const createExport = (generatedPath: string, importPath: string) =>
  `export * from '${getRelativeImport(generatedPath, importPath)}';`;

export const genGenerated = ({
  contractsPaths,
  commonTypesPath,
  reactPath,
  clientPath,
  generatedPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly commonTypesPath: string;
  readonly reactPath: string;
  readonly clientPath: string;
  readonly generatedPath: string;
}) => ({
  ts: `
${createExport(generatedPath, commonTypesPath)}
${createExport(generatedPath, reactPath)}
${createExport(generatedPath, clientPath)}
${_.flatMap(contractsPaths, ({ createContractPath, typesPath, abiPath }) => [createContractPath, typesPath, abiPath])
  .map((importPath) => createExport(generatedPath, importPath))
  .join('\n')}
`,
  js: `
${createExport(generatedPath, reactPath)}
${createExport(generatedPath, clientPath)}
${_.flatMap(contractsPaths, ({ createContractPath, abiPath }) => [createContractPath, abiPath])
  .map((importPath) => createExport(generatedPath, importPath))
  .join('\n')}
`,
});
