import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genVue = ({
  contractsPaths,
  vuePath,
  commonTypesPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly vuePath: string;
  readonly commonTypesPath: string;
  readonly clientPath: string;
}) => ({
  js: `
import { Client, DeveloperClient, LocalClient } from '@neo-one/client';
import { createClient, createDeveloperClients, createLocalClients } from '${getRelativeImport(vuePath, clientPath)}';

${contractsPaths
  .map(
    ({ name, createContractPath }) =>
      `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(vuePath, createContractPath)}';`,
  )
  .join('\n')}

class ContractsService {
  constructor() {
    this.client = createClient();
    this.developerClients = createDeveloperClients();
    this.localClients = createLocalClients();
    ${contractsPaths
      .map(({ name }) => `this.${lowerCaseFirst(name)} = ${getCreateSmartContractName(name)}(this.client);`)
      .join('\n    ')}
  }
}

export const contractsService = new ContractsService();
    `,
  ts: `
import { Client, DeveloperClient, LocalClient } from '@neo-one/client';
import { createClient, createDeveloperClients, createLocalClients } from '${getRelativeImport(vuePath, clientPath)}';
import { Contracts } from '${getRelativeImport(vuePath, commonTypesPath)}';

${contractsPaths
  .map(
    ({ name, createContractPath }) =>
      `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(vuePath, createContractPath)}';`,
  )
  .join('\n')}

export interface DeveloperClients {
  readonly [network: string]: DeveloperClient;
};
export interface LocalClients {
  readonly [network: string]: LocalClient;
};

class ContractsService {
  public readonly client: Client;
  public readonly developerClients: DeveloperClients;
  public readonly localClients: LocalClients;
  ${contractsPaths
    .map(({ name }) => `public readonly ${lowerCaseFirst(name)}: Contracts['${lowerCaseFirst(name)}'];`)
    .join('\n  ')}

  public constructor() {
    this.client = createClient();
    this.developerClients = createDeveloperClients();
    this.localClients = createLocalClients();
    ${contractsPaths
      .map(({ name }) => `this.${lowerCaseFirst(name)} = ${getCreateSmartContractName(name)}(this.client);`)
      .join('\n    ')}
  }
}

export const contractsService = new ContractsService();
  `,
});
