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

  const setHost = (host: string) => `this.client = createClient(${host});
this.developerClients = createDeveloperClients(${host});
${contractProperties}`;

  const constructor = `constructor() {
  ${setHost('')}
}`;

  return {
    js: `
import { Injectable } from '@angular/core';
import { createClient, createDeveloperClients } from '${clientImport}';
${contractImports}

${injectable}
export class ContractsService {
  ${constructor}

  setHost(host) {
    ${setHost('host')}
  }
}
    `,
    ts: `
import { Injectable } from '@angular/core';
import { Client, DeveloperClients } from '@neo-one/client';
import { Contracts } from '${getRelativeImport(angularPath, contractsPath)}';
import { createClient, createDeveloperClients } from '${clientImport}';
${contractImports}

${injectable}
export class ContractsService {
  public client: Client;
  public developerClients: DeveloperClients;
  ${contractTypeProperties}

  ${constructor}

  public setHost(host?: string) {
    ${setHost('host')}
  }
}
  `,
  };
};
