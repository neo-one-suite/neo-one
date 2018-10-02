// tslint:disable no-null-keyword
import * as React from 'react';
import { concat, defer, of } from 'rxjs';
import { FromStream } from '../FromStream';
import { WithNetworkClient } from './DeveloperToolsContext';

interface Props {
  readonly children: (url?: string) => React.ReactNode;
}

export function WithNEOTrackerURL({ children }: Props) {
  return (
    <WithNetworkClient>
      {({ localClient }) => (
        <FromStream
          props$={concat(
            of('https://neotracker.io'),
            defer(async () => {
              if (localClient === undefined) {
                return 'https://neotracker.io';
              }

              return localClient.getNEOTrackerURL();
            }),
          )}
        >
          {children}
        </FromStream>
      )}
    </WithNetworkClient>
  );
}
