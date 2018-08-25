// tslint:disable no-null-keyword
import * as React from 'react';
import { concat, defer, of } from 'rxjs';
import { FromStream } from '../FromStream';
import { WithNetworkClient } from './DeveloperToolsContext';

interface Props {
  readonly children: (url: string) => React.ReactNode;
}

export function WithNEOTrackerURL({ children }: Props) {
  return (
    <WithNetworkClient>
      {({ oneClient, projectID }) => (
        <FromStream
          props$={concat(
            of('https://neotracker.io'),
            defer(async () => {
              if (oneClient === undefined) {
                return 'https://neotracker.io';
              }
              const result = await oneClient.request({
                plugin: '@neo-one/server-plugin-project',
                options: { type: 'neotracker', projectID },
              });

              return result.response;
            }),
          )}
        >
          {children}
        </FromStream>
      )}
    </WithNetworkClient>
  );
}
