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

  return {
    js: `${sortedPaths
      .map(
        ({ name, createContractPath }) =>
          `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(
            contractsPath,
            createContractPath,
          )}'`,
      )
      .join('\n')}

export const createContracts = (client) => ({
  ${sortedPaths.map(({ name }) => `${lowerCaseFirst(name)}: ${getCreateSmartContractName(name)}(client),`).join('\n  ')}
});
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

export interface Contracts<TClient extends Client = Client> {
  ${sortedPaths
    .map(({ name }) => `readonly ${lowerCaseFirst(name)}: ${getSmartContractName(name)}<TClient>;`)
    .join('\n  ')}
}

export interface MigrationContracts {
  ${sortedPaths
    .map(({ name }) => `readonly ${lowerCaseFirst(name)}: ${getMigrationSmartContractName(name)};`)
    .join('\n  ')}
}

export const createContracts: <TClient extends Client>(client: TClient) => Contracts<TClient>;
`,
  };
};
