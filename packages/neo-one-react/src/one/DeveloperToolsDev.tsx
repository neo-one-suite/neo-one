import { Hash256 } from '@neo-one/client';
import * as React from 'react';
import { Provider } from 'reakit';
import { Props } from '../DeveloperTools';
import { ClientHook } from './ClientHook';
import { DeveloperToolsContext, LocalStateProvider } from './DeveloperToolsContext';
import { Pure } from './Pure';
import { ThemeProvider } from './ThemeProvider';
import { Toolbar } from './Toolbar';

export function DeveloperToolsDev(props: Props) {
  return (
    <DeveloperToolsContext.Provider value={props}>
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
            <Pure>
              <Toolbar />
              <ClientHook />
            </Pure>
          </Provider>
        </ThemeProvider>
      </LocalStateProvider>
    </DeveloperToolsContext.Provider>
  );
}
