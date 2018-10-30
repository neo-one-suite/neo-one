import { Client, DeveloperClient, Hash256, LocalClient } from '@neo-one/client-core';
import * as React from 'react';
import { Provider } from 'reakit';
import { ClientHook } from './ClientHook';
import { createContext, DeveloperToolsContext, LocalStateProvider } from './DeveloperToolsContext';
import { Pure } from './Pure';
import { ResizeHandler } from './ResizeHandler';
import { ResizeHandlerContext } from './ResizeHandlerContext';
import { ThemeProvider } from './ThemeProvider';
import { createContext as createToastsContext, ToastsContext } from './ToastsContainer';
import { Toolbar } from './Toolbar';
import { NetworkClients } from './types';

interface Props {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
  readonly resizeHandler: ResizeHandler;
}

export function DeveloperTools({ resizeHandler, ...props }: Props) {
  return (
    <DeveloperToolsContext.Provider value={createContext(props)}>
      <ToastsContext.Provider value={createToastsContext(resizeHandler)}>
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
                <Pure>
                  <ClientHook />
                </Pure>
              </Provider>
            </ThemeProvider>
          </LocalStateProvider>
        </ResizeHandlerContext.Provider>
      </ToastsContext.Provider>
    </DeveloperToolsContext.Provider>
  );
}
