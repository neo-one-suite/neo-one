import _ from 'lodash';
import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getMigrationSmartContractName, getSmartContractName } from '../types';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genContracts = ({
  contractsPaths,
  contractsPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly contractsPath: string;
}) => {
  const sortedPaths = _.sortBy(contractsPaths, [({ name }: ContractPaths) => name]);
  const createImports = sortedPaths
    .map(
      ({ name, createContractPath }) =>
        `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(contractsPath, createContractPath)}'`,
    )
    .join('\n');

  const createContracts = `({
    ${sortedPaths
      .map(({ name }) => `${lowerCaseFirst(name)}: ${getCreateSmartContractName(name)}(client),`)
      .join('\n  ')}
  });`;

  return {
    js: `${createImports}

export const createContracts = (client) => ${createContracts}
  `,
    ts: `import { Client } from '@neo-one/client';

${sortedPaths
  .map(
    ({ name, typesPath }) =>
      `import { ${getSmartContractName(name)}, ${getMigrationSmartContractName(name)} } from '${getRelativeImport(
        contractsPath,
        typesPath,
      )}'`,
  )
  .join('\n')}

${createImports}

export interface Contracts<TClient extends Client = Client> {
  ${sortedPaths
    .map(({ name }) => `readonly ${lowerCaseFirst(name)}: ${getSmartContractName(name)}<TClient>;`)
    .join('\n  ')}
}
// Refer to the MigrationSmartContract documentation at https://neo-one.io/docs/deployment for more information.
export interface MigrationContracts {
  ${sortedPaths
    .map(({ name }) => `readonly ${lowerCaseFirst(name)}: ${getMigrationSmartContractName(name)};`)
    .join('\n  ')}
}

export const createContracts = <TClient extends Client>(client: TClient): Contracts<TClient> => ${createContracts};
`,
  };
};
