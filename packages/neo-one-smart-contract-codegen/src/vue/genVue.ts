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
}) => {
  const clientImport = getRelativeImport(vuePath, clientPath);
  const contractImports = contractsPaths
    .map(
      ({ name, createContractPath }) =>
        `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(vuePath, createContractPath)}';`,
    )
    .join('\n');
  const contractProperties = contractsPaths
    .map(({ name }) => `this.${lowerCaseFirst(name)} = ${getCreateSmartContractName(name)}(this.client);`)
    .join('\n    ');
  const contractTypeProperties = contractsPaths
    .map(({ name }) => `public readonly ${lowerCaseFirst(name)}: Contracts['${lowerCaseFirst(name)}'];`)
    .join('\n  ');

  return {
    js: `
import { createClient, createDeveloperClients } from '${clientImport}';

${contractImports}

export class ContractsService {
  constructor() {
    this.setHost();
  }

  setHost(host) {
    this.client = createClient(host);
    this.developerClients = createDeveloperClients(host);
    ${contractProperties}
  }
}

export const instance = new ContractsService();
    `,
    ts: `
import { Client, DeveloperClients, UserAccountProviders } from '@neo-one/client';
import { Contracts } from '${getRelativeImport(vuePath, commonTypesPath)}';
import { DefaultUserAccountProviders } from '${clientImport}';

export class ContractsService<TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders> {
  public readonly client: Client<TUserAccountProviders>;
  public readonly developerClients: DeveloperClients;
  ${contractTypeProperties}
  public setHost(host?: string);
}

export const instance: ContractsService
  `,
  };
};
