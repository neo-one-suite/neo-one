import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genAngular = ({
  contractsPaths,
  angularPath,
  commonTypesPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly angularPath: string;
  readonly commonTypesPath: string;
  readonly clientPath: string;
}) => {
  const clientImport = getRelativeImport(angularPath, clientPath);
  const contractImports = contractsPaths
    .map(
      ({ name, createContractPath }) =>
        `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(angularPath, createContractPath)}';`,
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
import { Injectable } from '@angular/core';
import { createClient, createDeveloperClients } from '${clientImport}';

${contractImports}

@Injectable({
  providedIn: 'root'
})
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
    `,
    ts: `
import { Client, DeveloperClients, UserAccountProviders } from '@neo-one/client';
import { Contracts } from '${getRelativeImport(angularPath, commonTypesPath)}';
import { DefaultUserAccountProviders } from '${clientImport}';

export class ContractsService<TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders> {
  public readonly client: Client<TUserAccountProviders>;
  public readonly developerClients: DeveloperClients;
  ${contractTypeProperties}
  public setHost(host?: string);
}
  `,
  };
};
