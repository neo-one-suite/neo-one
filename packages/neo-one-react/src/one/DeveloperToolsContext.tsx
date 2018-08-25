import { AddressString, Client, DeveloperClient, OneClient } from '@neo-one/client';
import { ActionMap } from 'constate';
import localforage from 'localforage';
import * as React from 'react';
import { Container } from 'reakit';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FromStream } from '../FromStream';
import { NetworkClients } from '../types';

interface DeveloperToolsContextType {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly oneClients: NetworkClients<OneClient>;
  readonly projectID: string;
}
// tslint:disable-next-line no-any
export const DeveloperToolsContext = React.createContext<DeveloperToolsContextType>(undefined as any);

interface WithNetworkClientProps {
  readonly children: (
    options: {
      readonly client: Client;
      readonly developerClient?: DeveloperClient;
      readonly oneClient?: OneClient;
      readonly projectID: string;
    },
  ) => React.ReactNode;
}

export function WithNetworkClient({ children }: WithNetworkClientProps) {
  return (
    <DeveloperToolsContext.Consumer>
      {({ client, developerClients, oneClients, projectID }) => (
        <FromStream
          props$={client.currentNetwork$.pipe(
            map((network) => {
              const oneClient = oneClients[network];
              const developerClient = developerClients[network];

              return { client, developerClient, oneClient, projectID };
            }),
          )}
        >
          {children}
        </FromStream>
      )}
    </DeveloperToolsContext.Consumer>
  );
}

export interface Token {
  readonly network: string;
  readonly address: AddressString;
  readonly symbol: AddressString;
  readonly decimals: number;
}
export interface LocalState {
  readonly autoConsensus: boolean;
  readonly tokens: ReadonlyArray<Token>;
}
export interface LocalStateContextType {
  readonly localState: LocalState;
  readonly onChange: (state: Partial<LocalState>) => void;
}
const INITIAL_LOCAL_STATE: LocalState = {
  autoConsensus: true,
  tokens: [],
};

const store = localforage.createInstance({
  name: 'neoONEDeveloperTools',
  version: 1.0,
  storeName: 'store',
  description: 'Local developer state persisted across sessions',
});
// tslint:disable-next-line no-any
const LocalStateContext = React.createContext<LocalStateContextType>(undefined as any);

interface LocalStateProviderState {
  readonly localState: LocalState;
}

interface LocalStateProviderActions {
  readonly onChange: (state: Partial<LocalState>) => void;
}

export function LocalStateProvider({ children }: { readonly children: React.ReactNode }) {
  const localStatePromise = store.getItem<LocalState | null>('localState');

  const actions: ActionMap<LocalStateProviderState, LocalStateProviderActions> = {
    onChange: (state) => ({ localState }) => {
      const nextLocalState = { ...localState, ...state };
      store.setItem('localState', nextLocalState).catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });

      return { localState: nextLocalState };
    },
  };

  return (
    <FromStream props$={from(localStatePromise)}>
      {(localStateIn) => (
        <Container
          initialState={{ localState: localStateIn === null ? INITIAL_LOCAL_STATE : localStateIn }}
          actions={actions}
        >
          {({ localState, onChange }) => (
            <LocalStateContext.Provider
              value={{
                localState,
                onChange: (state) => {
                  onChange(state);
                },
              }}
            >
              {children}
            </LocalStateContext.Provider>
          )}
        </Container>
      )}
    </FromStream>
  );
}

interface WithTokensProps {
  readonly children: (tokens: ReadonlyArray<Token>) => React.ReactNode;
}

export function WithTokens({ children }: WithTokensProps) {
  return <LocalStateContext.Consumer>{({ localState }) => children(localState.tokens)}</LocalStateContext.Consumer>;
}

interface WithOnChangeTokensProps {
  readonly children: (onChange: (tokens: ReadonlyArray<Token>) => void) => React.ReactNode;
}

export function WithOnChangeTokens({ children }: WithOnChangeTokensProps) {
  return (
    <LocalStateContext.Consumer>
      {({ onChange }) => children((tokens) => onChange({ tokens }))}
    </LocalStateContext.Consumer>
  );
}

interface WithResetLocalStateProps {
  readonly children: (reset: () => void) => React.ReactNode;
}

export function WithResetLocalState({ children }: WithResetLocalStateProps) {
  return (
    <LocalStateContext.Consumer>
      {({ onChange }) => children(() => onChange(INITIAL_LOCAL_STATE))}
    </LocalStateContext.Consumer>
  );
}

interface WithAutoConsensusProps {
  readonly children: (options: { readonly toggle: () => void; readonly autoConsensus: boolean }) => React.ReactNode;
}

export function WithAutoConsensus({ children }: WithAutoConsensusProps) {
  return (
    <LocalStateContext.Consumer>
      {({ localState, onChange }) =>
        children({
          autoConsensus: localState.autoConsensus,
          toggle: () => onChange({ autoConsensus: !localState.autoConsensus }),
        })
      }
    </LocalStateContext.Consumer>
  );
}
