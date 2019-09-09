/* @hash 2e91e5cc2a3b6ad5aea14fdec2177921 */
// tslint:disable
/* eslint-disable */
import { DeveloperTools } from '@neo-one/client';
import * as React from 'react';
import { createClient, createDeveloperClients } from './client';
import { createEscrowSmartContract } from './Escrow/contract';
import { createTokenSmartContract } from './Token/contract';
import { createICOSmartContract } from './ICO/contract';

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
        escrow: createEscrowSmartContract(client),
        token: createTokenSmartContract(client),
        ico: createICOSmartContract(client),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const WithContracts = ({ children }) => <Context.Consumer>{children}</Context.Consumer>;

export const useContracts = () => React.useContext(Context);
