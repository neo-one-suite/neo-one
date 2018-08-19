import { getCreateSmartContractName } from '../contract';
import { ContractPaths } from '../type';
import { getRelativeImport, lowerCaseFirst } from '../utils';

export const genReact = ({
  contractsPaths,
  reactPath,
  commonTypesPath,
  clientPath,
}: {
  readonly contractsPaths: ReadonlyArray<ContractPaths>;
  readonly reactPath: string;
  readonly commonTypesPath: string;
  readonly clientPath: string;
}) => ({
  js: `
import * as React from 'react';
import { createClient } from '${getRelativeImport(reactPath, clientPath)}';
${contractsPaths
    .map(
      ({ name, createContractPath }) =>
        `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(reactPath, createContractPath)}';`,
    )
    .join('\n')}

const Context = React.createContext(undefined);

export const ContractsProvider = ({ client: clientIn, children }) => {
  const client = clientIn === undefined ? createClient() : clientIn;

  return (
    <Context.Provider
      value={{
        client,
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
import { Client } from '@neo-one/client';
import * as React from 'react';
import { Contracts } from '${getRelativeImport(reactPath, commonTypesPath)}';
import { createClient } from '${getRelativeImport(reactPath, clientPath)}';
${contractsPaths
    .map(
      ({ name, createContractPath }) =>
        `import { ${getCreateSmartContractName(name)} } from '${getRelativeImport(reactPath, createContractPath)}';`,
    )
    .join('\n')}

export interface WithClient<TClient extends Client> {
  readonly client: TClient;
}
export type ContractsWithClient<TClient extends Client> = Contracts & WithClient<TClient>;
const Context: any = React.createContext<ContractsWithClient<Client>>(undefined as any);

export interface ContractsProviderProps<TClient extends Client> {
  readonly client?: TClient;
  readonly children?: React.ReactNode;
}
export const ContractsProvider = <TClient extends Client>({ client: clientIn, children }: ContractsProviderProps<TClient>) => {
  const client = clientIn === undefined ? createClient() : clientIn;
  return (
    <Context.Provider
      value={{
        client,
        ${contractsPaths
          .map(({ name }) => `${lowerCaseFirst(name)}: ${getCreateSmartContractName(name)}(client),`)
          .join('\n      ')}
      }}
    >
      {children}
    </Context.Provider>
  );
};

export interface WithContractsProps<TClient extends Client> {
  readonly children: (contracts: ContractsWithClient<TClient>) => React.ReactNode;
}
export const WithContracts = <TClient extends Client>({ children }: WithContractsProps<TClient>) => (
  <Context.Consumer>
    {children}
  </Context.Consumer>
);
  `,
});
