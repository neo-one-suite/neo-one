import { Client, DeveloperClient, Hash256, LocalClient } from '@neo-one/client-core';
import { FromStream } from '@neo-one/react';
import * as React from 'react';
import { Provider } from 'reakit';
import { Observable } from 'rxjs';
import { ClientHook } from './ClientHook';
import { createContext, DeveloperToolsContext, LocalStateProvider } from './DeveloperToolsContext';
import { ResizeHandler } from './ResizeHandler';
import { ResizeHandlerContext } from './ResizeHandlerContext';
import { ThemeProvider } from './ThemeProvider';
import { Toolbar } from './Toolbar';
import { NetworkClients } from './types';

export interface Clients {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
}

interface Props {
  readonly clients$: Observable<Clients>;
  readonly resizeHandler: ResizeHandler;
}

export function DeveloperTools({ resizeHandler, clients$ }: Props) {
  return (
    <FromStream props={[clients$]} createStream={() => clients$}>
      {(props) => (
        <DeveloperToolsContext.Provider value={createContext(props)}>
          <ResizeHandlerContext.Provider value={resizeHandler}>
            <LocalStateProvider>
              <ThemeProvider>
                <Provider
                  initialState={{
                    transfer: {
                      text: '',
                      asset: { type: 'asset', value: Hash256.NEO, label: 'NEO' },
                      loading: false,
                      to: [],
                    },
                    toasts: {
                      toasts: [],
                    },
                  }}
                >
                  <Toolbar resizeHandler={resizeHandler} />
                  <ClientHook />
                </Provider>
              </ThemeProvider>
            </LocalStateProvider>
          </ResizeHandlerContext.Provider>
        </DeveloperToolsContext.Provider>
      )}
    </FromStream>
  );
}
