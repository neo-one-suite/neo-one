import { Hash256 } from '@neo-one/client';
import * as React from 'react';
import { Provider } from 'reakit';
import { Props } from '../DeveloperTools';
import { DeveloperToolsContext, LocalStateProvider } from './DeveloperToolsContext';
import { ThemeProvider } from './ThemeProvider';
import { Toolbar } from './Toolbar';

class Pure extends React.Component {
  public shouldComponentUpdate() {
    return false;
  }

  public render() {
    return this.props.children;
  }
}

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
              errors: {
                errors: [],
              },
            }}
          >
            <Pure>
              <Toolbar />
            </Pure>
          </Provider>
        </ThemeProvider>
      </LocalStateProvider>
    </DeveloperToolsContext.Provider>
  );
}
