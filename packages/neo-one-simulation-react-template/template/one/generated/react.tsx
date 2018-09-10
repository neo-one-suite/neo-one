/* @hash 8f1fd62ec35fb06b58cac05a12f84c70 */
// tslint:disable
/* eslint-disable */
import { DeveloperTools as DeveloperToolsBase } from '@neo-one/react';
import { Client, DeveloperClient, OneClient } from '@neo-one/client';
import * as React from 'react';
import { Contracts } from './types';
import { createClient, createDeveloperClients, createOneClients } from './client';
import { projectID } from './projectID';
import { createContractSmartContract } from './Contract/contract';

export interface WithClients<TClient extends Client> {
  readonly client: TClient;
  readonly developerClients: {
    readonly [network: string]: DeveloperClient;
  };
  readonly oneClients: {
    readonly [network: string]: OneClient;
  };
}
export type ContractsWithClients<TClient extends Client> = Contracts & WithClients<TClient>;
const Context: any = React.createContext<ContractsWithClients<Client>>(undefined as any);

export type ContractsProviderProps<TClient extends Client> = Partial<WithClients<TClient>> & {
  readonly children?: React.ReactNode;
};
export const ContractsProvider = <TClient extends Client>({
  client: clientIn,
  developerClients: developerClientsIn,
  oneClients: oneClientsIn,
  children,
}: ContractsProviderProps<TClient>) => {
  const client = clientIn === undefined ? createClient() : clientIn;
  const developerClients = developerClientsIn === undefined ? createDeveloperClients() : developerClientsIn;
  const oneClients = oneClientsIn === undefined ? createOneClients() : oneClientsIn;

  return (
    <Context.Provider
      value={{
        client,
        developerClients,
        oneClients,
        contract: createContractSmartContract(client),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export interface WithContractsProps<TClient extends Client> {
  readonly children: (contracts: ContractsWithClients<TClient>) => React.ReactNode;
}
export const WithContracts = <TClient extends Client>({ children }: WithContractsProps<TClient>) => (
  <Context.Consumer>{children}</Context.Consumer>
);

export const DeveloperTools = () => (
  <WithContracts>
    {({ client, developerClients, oneClients }) => (
      <DeveloperToolsBase
        client={client}
        developerClients={developerClients}
        oneClients={oneClients}
        projectID={projectID}
      />
    )}
  </WithContracts>
);
