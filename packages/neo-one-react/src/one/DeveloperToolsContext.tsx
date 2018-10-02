import { AddressString, Client, DeveloperClient } from '@neo-one/client';
import localforage from 'localforage';
import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FromStream } from '../FromStream';
import { LocalClient, NetworkClients, ReactSyntheticEvent } from '../types';

interface DeveloperToolsContextType {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
}
// tslint:disable-next-line no-any
export const DeveloperToolsContext = React.createContext<DeveloperToolsContextType>(undefined as any);

interface WithNetworkClientProps {
  readonly children: (
    options: {
      readonly client: Client;
      readonly developerClient?: DeveloperClient;
      readonly localClient?: LocalClient;
    },
  ) => React.ReactNode;
}

export function WithNetworkClient({ children }: WithNetworkClientProps) {
  return (
    <DeveloperToolsContext.Consumer>
      {({ client, developerClients, localClients }) => (
        <FromStream
          props$={client.currentNetwork$.pipe(
            map((network) => {
              const localClient = localClients[network];
              const developerClient = developerClients[network];

              return { client, developerClient, localClient };
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
  readonly autoSystemFee: boolean;
  readonly tokens: ReadonlyArray<Token>;
}
export interface LocalStateContextType {
  readonly localState$: BehaviorSubject<LocalState>;
  readonly onChange: (state: Partial<LocalState>) => void;
}
const INITIAL_LOCAL_STATE: LocalState = {
  autoConsensus: true,
  autoSystemFee: true,
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

export function LocalStateProvider({ children }: { readonly children: React.ReactNode }) {
  const localState$ = new BehaviorSubject<LocalState>(INITIAL_LOCAL_STATE);
  store
    .getItem<LocalState | null>('localState')
    .then((localState) => {
      if (localState !== null) {
        localState$.next(localState);
      }
    })
    .catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });

  const onChange = (state: Partial<LocalState>) => {
    const nextLocalState = { ...localState$.getValue(), ...state };
    localState$.next(nextLocalState);
    store.setItem('localState', nextLocalState).catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
  };

  return <LocalStateContext.Provider value={{ localState$, onChange }}>{children}</LocalStateContext.Provider>;
}

interface WithTokensProps {
  readonly children: (tokens$: Observable<ReadonlyArray<Token>>) => React.ReactNode;
}

export function WithTokens({ children }: WithTokensProps) {
  return (
    <LocalStateContext.Consumer>
      {({ localState$ }) => children(localState$.pipe(map((localState) => localState.tokens, distinctUntilChanged())))}
    </LocalStateContext.Consumer>
  );
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
  readonly children: (
    options: { readonly toggle: (event: ReactSyntheticEvent) => void; readonly autoConsensus$: Observable<boolean> },
  ) => React.ReactNode;
}

export function WithAutoConsensus({ children }: WithAutoConsensusProps) {
  return (
    <LocalStateContext.Consumer>
      {({ localState$, onChange }) =>
        children({
          autoConsensus$: localState$.pipe(
            map((localState) => localState.autoConsensus),
            distinctUntilChanged(),
          ),
          toggle: (event) => {
            onChange({ autoConsensus: !localState$.getValue().autoConsensus });
            event.stopPropagation();
          },
        })
      }
    </LocalStateContext.Consumer>
  );
}

interface WithAutoSystemFeeProps {
  readonly children: (
    options: { readonly toggle: (event: ReactSyntheticEvent) => void; readonly autoSystemFee$: Observable<boolean> },
  ) => React.ReactNode;
}

export function WithAutoSystemFee({ children }: WithAutoSystemFeeProps) {
  return (
    <LocalStateContext.Consumer>
      {({ localState$, onChange }) =>
        children({
          autoSystemFee$: localState$.pipe(
            map((localState) => localState.autoSystemFee),
            distinctUntilChanged(),
          ),
          toggle: (event) => {
            onChange({ autoSystemFee: !localState$.getValue().autoSystemFee });
            event.stopPropagation();
          },
        })
      }
    </LocalStateContext.Consumer>
  );
}
