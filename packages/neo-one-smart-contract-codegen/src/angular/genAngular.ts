import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genAngular = ({
  contractsPaths,
  angularPath,
  commonTypesPath,
  clientPath,
  browser,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly angularPath: string;
  readonly commonTypesPath: string;
  readonly clientPath: string;
  readonly browser: boolean;
}) => ({
  js: `
import { Injectable } from '@angular/core';
import { Client, DeveloperClient, LocalClient } from '@neo-one/client${browser ? '-browserify' : ''}';
import { createClient, createDeveloperClients, createLocalClients } from '${getRelativeImport(
    angularPath,
    clientPath,
  )}';

${contractsPaths
  .map(
    ({ name, createContractPath }) =>
      `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(angularPath, createContractPath)}';`,
  )
  .join('\n')}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  constructor() {
    this.client = createClient();
    this.developerClients = createDeveloperClients();
    this.localClients = createLocalClients();
    ${contractsPaths
      .map(({ name }) => `this.${lowerCaseFirst(name)} = ${getCreateSmartContractName(name)}(this.client);`)
      .join('\n    ')}
  }

  setHost(host) {
    this.client = createClient(host);
    this.developerClients = createDeveloperClients(host);
    this.localClients = createLocalClients(host);
  }
}
    `,
  ts: `
import { Injectable } from '@angular/core';
import { Client, DeveloperClient, LocalClient } from '@neo-one/client${browser ? '-browserify' : ''}';
import { createClient, createDeveloperClients, createLocalClients } from '${getRelativeImport(
    angularPath,
    clientPath,
  )}';
import { Contracts } from '${getRelativeImport(angularPath, commonTypesPath)}';

${contractsPaths
  .map(
    ({ name, createContractPath }) =>
      `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(angularPath, createContractPath)}';`,
  )
  .join('\n')}

export interface DeveloperClients {
  readonly [network: string]: DeveloperClient;
};
export interface LocalClients {
  readonly [network: string]: LocalClient;
};

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
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

  public setHost(host) {
    this.client = createClient(host);
    this.developerClients = createDeveloperClients(host);
    this.localClients = createLocalClients(host);
  }
}
  `,
});
