import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genReact = ({
  contractsPaths,
  reactPath,
  contractsPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly reactPath: string;
  readonly contractsPath: string;
  readonly clientPath: string;
}) => ({
  js: `
import { DeveloperTools } from '@neo-one/client';
import * as React from 'react';
import { createClient, createDeveloperClients } from '${getRelativeImport(reactPath, clientPath)}';
${contractsPaths
  .map(
    ({ name, createContractPath }) =>
      `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(reactPath, createContractPath)}';`,
  )
  .join('\n')}

const Context = React.createContext(undefined);

export const ContractsProvider = ({
  client: clientIn,
  developerClients: developerClientsIn,
  localClients: localClientsIn,
  host,
  children,
}) => {
  const client = clientIn === undefined ? createClient(host) : clientIn;
  const developerClients = developerClientsIn === undefined ? createDeveloperClients(host) : developerClientsIn;
  DeveloperTools.enable({ client, developerClients });

  return (
    <Context.Provider
      value={{
        client,
        developerClients,
        ${contractsPaths
          .map(({ name }) => `${lowerCaseFirst(name)}: ${getCreateSmartContractName(name)}(client),`)
          .join('\n      ')}
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const WithContracts = ({ children }) => (
  <Context.Consumer>
    {children}
  </Context.Consumer>
);
`,
  ts: `
import { Client, DeveloperClient, DeveloperClients } from '@neo-one/client';
import * as React from 'react';
import { Contracts } from '${getRelativeImport(reactPath, contractsPath)}';

export interface WithClients<TClient extends Client> {
  readonly client: TClient;
  readonly developerClients: DeveloperClients;
  readonly host?: string;
}
export type ContractsWithClients<TClient extends Client> = Contracts & WithClients<TClient>;
export type ContractsProviderProps<TClient extends Client> = Partial<WithClients<TClient>> & {
  readonly children?: React.ReactNode;
}
export const ContractsProvider: <TClient extends Client>({
  client: clientIn,
  developerClients: developerClientsIn,
  host,
  children,
}: ContractsProviderProps<TClient>) => React.ReactElement;

export interface WithContractsProps<TClient extends Client> {
  readonly children: (contracts: ContractsWithClients<TClient>) => React.ReactNode;
}
export const WithContracts: <TClient extends Client>({ children }: WithContractsProps<TClient>) => React.ReactElement;
  `,
});
