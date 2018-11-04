// tslint:disable no-null-keyword
import { FromStream } from '@neo-one/react';
import * as React from 'react';
import { concat, defer, of } from 'rxjs';
import { WithNetworkClient } from './DeveloperToolsContext';

interface Props {
  readonly children: (url?: string) => React.ReactNode;
}

export function WithNEOTrackerURL({ children }: Props) {
  return (
    <WithNetworkClient>
      {({ localClient }) => (
        <FromStream
          props={[localClient]}
          createStream={() =>
            concat(
              of('https://neotracker.io'),
              defer(async () => {
                if (localClient === undefined) {
                  return 'https://neotracker.io';
                }

                return localClient.getNEOTrackerURL();
              }),
            )
          }
        >
          {children}
        </FromStream>
      )}
    </WithNetworkClient>
  );
}
