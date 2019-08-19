import { Client, DeveloperClient } from '@neo-one/client-core';
import { GlobalFonts, useStream } from '@neo-one/react-common';
import * as React from 'react';
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
}

interface Props {
  readonly clients$: Observable<Clients>;
  readonly resizeHandler: ResizeHandler;
}

export function DeveloperTools({ resizeHandler, clients$ }: Props) {
  const props = useStream(() => clients$, [clients$]);

  return (
    <>
      <GlobalFonts />
      <DeveloperToolsContext.Provider value={createContext(props)}>
        <ResizeHandlerContext.Provider value={resizeHandler}>
          <LocalStateProvider>
            <ThemeProvider>
              <>
                <Toolbar resizeHandler={resizeHandler} />
                <ClientHook />
              </>
            </ThemeProvider>
          </LocalStateProvider>
        </ResizeHandlerContext.Provider>
      </DeveloperToolsContext.Provider>
    </>
  );
}
