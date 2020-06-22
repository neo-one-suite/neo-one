import { Client, DeveloperClient } from '@neo-one/client-core';
import { useStream } from '@neo-one/react-common';
import localforage from 'localforage';
import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { NetworkClients, Token } from './types';

const { useCallback, useContext } = React;

export interface DeveloperToolsContextTypeBase {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
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

// tslint:disable-next-line:no-any
export const DeveloperToolsContext = React.createContext<DeveloperToolsContextType>(undefined as any);

export const useNetworkClients = () => {
  const { client, block$, developerClients } = useContext(DeveloperToolsContext);
  const { developerClient } = useStream(
    () => client.currentNetwork$.pipe(map((network) => ({ developerClient: developerClients[network] }))),
    [client, developerClients],
    {
      developerClient: developerClients[client.getCurrentNetwork()],
    },
  );

  return { client, block$, developerClient };
};

export interface LocalState {
  readonly autoConsensus: boolean;
  readonly autoSystemFee: boolean;
  readonly tokens: readonly Token[];
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

export const useTokens = (): readonly [ReadonlyArray<Token>, (tokens: ReadonlyArray<Token>) => void] => {
  const { localState$, onChange } = useContext(LocalStateContext);
  const tokens = useStream(
    () => localState$.pipe(map((localState) => localState.tokens, distinctUntilChanged())),
    [localState$],
    localState$.getValue().tokens,
  );
  const onChangeTokens = useCallback((nextTokens: readonly Token[]) => onChange({ tokens: nextTokens }), [onChange]);

  return [tokens, onChangeTokens];
};

export const useResetLocalState = () => {
  const { onChange } = useContext(LocalStateContext);

  return useCallback(() => onChange(INITIAL_LOCAL_STATE), [onChange]);
};

export const useAutoConsensus = (): readonly [boolean, () => void] => {
  const { localState$, onChange } = useContext(LocalStateContext);
  const autoConsensus = useStream(
    () => localState$.pipe(map((localState) => localState.autoConsensus, distinctUntilChanged())),
    [localState$],
    localState$.getValue().autoConsensus,
  );
  const toggle = useCallback(() => onChange({ autoConsensus: !autoConsensus }), [autoConsensus, onChange]);

  return [autoConsensus, toggle];
};

export const useAutoSystemFee = (): readonly [boolean, () => void] => {
  const { localState$, onChange } = useContext(LocalStateContext);
  const autoSystemFee = useStream(
    () => localState$.pipe(map((localState) => localState.autoSystemFee, distinctUntilChanged())),
    [localState$],
    localState$.getValue().autoSystemFee,
  );
  const toggle = useCallback(() => onChange({ autoSystemFee: !autoSystemFee }), [autoSystemFee, onChange]);

  return [autoSystemFee, toggle];
};
