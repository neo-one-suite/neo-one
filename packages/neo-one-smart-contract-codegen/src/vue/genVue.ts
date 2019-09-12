import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genVue = ({
  contractsPaths,
  vuePath,
  contractsPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly vuePath: string;
  readonly contractsPath: string;
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
    .map(({ name }) => `public ${lowerCaseFirst(name)}: Contracts['${lowerCaseFirst(name)}'];`)
    .join('\n  ');

  const setHost = (host: string) => `this.client = createClient(${host});
this.developerClients = createDeveloperClients(${host});
${contractProperties}`;

  const constructor = `constructor() {
  ${setHost('')}
}`;

  return {
    js: `
import { createClient, createDeveloperClients } from '${clientImport}';
${contractImports}

export class ContractsService {
  ${constructor}

  setHost(host) {
    ${setHost('host')}
  }
}

export const contractsService = new ContractsService();
    `,
    ts: `
import { Client, DeveloperClients } from '@neo-one/client';
import { createClient, createDeveloperClients } from '${clientImport}';
import { Contracts } from '${getRelativeImport(vuePath, contractsPath)}';
${contractImports}

export class ContractsService {
  public client: Client;
  public developerClients: DeveloperClients;
  ${contractTypeProperties}

  ${constructor}

  public setHost(host?: string) {
    ${setHost('host')}
  }
}

export const contractsService = new ContractsService();
  `,
  };
};
