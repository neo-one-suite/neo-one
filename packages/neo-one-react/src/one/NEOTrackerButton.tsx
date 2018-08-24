// tslint:disable no-null-keyword
import * as React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { Base, Link } from 'reakit';
import { concat, defer, of } from 'rxjs';
import { FromStream } from '../FromStream';
import { WithNetworkClient } from './DeveloperToolsContext';
import { ToolbarButton } from './ToolbarButton';

export function NEOTrackerButton() {
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
          {(neotrackerURL) => (
            <ToolbarButton as={Link} href={neotrackerURL} help="Open NEO Tracker..." target="_blank">
              <Base>
                <MdOpenInNew />
              </Base>
            </ToolbarButton>
          )}
        </FromStream>
      )}
    </WithNetworkClient>
  );
}
