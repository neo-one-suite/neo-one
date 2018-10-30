import { Client, DeveloperClient, LocalClient } from '@neo-one/client';
import { FromStream, Token } from '@neo-one/react-common';
import localforage from 'localforage';
import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { NetworkClients, ReactSyntheticEvent } from './types';

export interface DeveloperToolsContextTypeBase {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
}

export interface DeveloperToolsContextType extends DeveloperToolsContextTypeBase {
  readonly block$: Client['block$'];
  readonly currentUserAccount$: Client['currentUserAccount$'];
  readonly userAccounts$: Client['userAccounts$'];
  readonly accountState$: Client['accountState$'];
  readonly currentNetwork$: Client['currentNetwork$'];
  readonly networks$: Client['networks$'];
}

export const createContext = (options: DeveloperToolsContextTypeBase): DeveloperToolsContextType => ({
  ...options,
  // Normalize the rxjs implementation from what's passed in from the other window.
  block$: new Observable((observer) => options.client.block$.subscribe(observer)),
  currentUserAccount$: new Observable((observer) => options.client.currentUserAccount$.subscribe(observer)),
  userAccounts$: new Observable((observer) => options.client.userAccounts$.subscribe(observer)),
  accountState$: new Observable((observer) => options.client.accountState$.subscribe(observer)),
  currentNetwork$: new Observable((observer) => options.client.currentNetwork$.subscribe(observer)),
  networks$: new Observable((observer) => options.client.networks$.subscribe(observer)),
});

// tslint:disable-next-line no-any
export const DeveloperToolsContext: any = React.createContext<DeveloperToolsContextType>(undefined as any);

interface WithNetworkClientProps {
  readonly children: (
    options: {
      readonly client: Client;
      readonly block$: Client['block$'];
      readonly developerClient?: DeveloperClient;
      readonly localClient?: LocalClient;
    },
  ) => React.ReactNode;
}

export function WithNetworkClient({ children }: WithNetworkClientProps) {
  return (
    <DeveloperToolsContext.Consumer>
      {({ client, block$, developerClients, localClients }: DeveloperToolsContextType) => (
        <FromStream
          props={[client, localClients, developerClients]}
          createStream={() =>
            client.currentNetwork$.pipe(
              map((network) => {
                const localClient = localClients[network];
                const developerClient = developerClients[network];

                return { client, block$, developerClient, localClient };
              }),
            )
          }
        >
          {children}
        </FromStream>
      )}
    </DeveloperToolsContext.Consumer>
  );
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
const LocalStateContext: any = React.createContext<LocalStateContextType>(undefined as any);

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
      {({ localState$ }: LocalStateContextType) =>
        children(localState$.pipe(map((localState) => localState.tokens, distinctUntilChanged())))
      }
    </LocalStateContext.Consumer>
  );
}

interface WithOnChangeTokensProps {
  readonly children: (onChange: (tokens: ReadonlyArray<Token>) => void) => React.ReactNode;
}

export function WithOnChangeTokens({ children }: WithOnChangeTokensProps) {
  return (
    <LocalStateContext.Consumer>
      {({ onChange }: LocalStateContextType) => children((tokens) => onChange({ tokens }))}
    </LocalStateContext.Consumer>
  );
}

interface WithResetLocalStateProps {
  readonly children: (reset: () => void) => React.ReactNode;
}

export function WithResetLocalState({ children }: WithResetLocalStateProps) {
  return (
    <LocalStateContext.Consumer>
      {({ onChange }: LocalStateContextType) => children(() => onChange(INITIAL_LOCAL_STATE))}
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
      {({ localState$, onChange }: LocalStateContextType) =>
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
      {({ localState$, onChange }: LocalStateContextType) =>
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
