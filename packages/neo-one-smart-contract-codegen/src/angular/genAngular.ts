import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genAngular = ({
  contractsPaths,
  angularPath,
  contractsPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly angularPath: string;
  readonly contractsPath: string;
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
    .map(({ name }) => `public ${lowerCaseFirst(name)}: Contracts['${lowerCaseFirst(name)}'];`)
    .join('\n  ');

  const injectable = `@Injectable({
  providedIn: 'root'
})`;
  const constructor = `constructor() {
  this.setHost();
}`;
  const setHost = `this.client = createClient(host);
this.developerClients = createDeveloperClients(host);
${contractProperties}`;

  return {
    js: `
import { Injectable } from '@angular/core';
import { createClient, createDeveloperClients } from '${clientImport}';

${contractImports}

${injectable}
export class ContractsService {
  ${constructor}

  setHost(host) {
    ${setHost}
  }
}
    `,
    ts: `
import { Injectable } from '@angular/core';
import { Client, DeveloperClients, UserAccountProviders } from '@neo-one/client';
import { Contracts } from '${getRelativeImport(angularPath, contractsPath)}';
import { DefaultUserAccountProviders, createClient, createDeveloperClients } from '${clientImport}';

${injectable}
export class ContractsService<TUserAccountProviders extends UserAccountProviders<any> = DefaultUserAccountProviders> {
  public client: Client<TUserAccountProviders>;
  public developerClients: DeveloperClients;
  ${contractTypeProperties}

  public setHost(host?: string) {
    ${setHost}
  }
}
  `,
  };
};
