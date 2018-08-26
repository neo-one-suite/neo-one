import * as React from 'react';
import { MdRefresh } from 'react-icons/md';
import { WithNetworkClient } from './DeveloperToolsContext';
import { ToolbarButton } from './ToolbarButton';
import { WithAddError } from './WithAddError';

export function ResetButton() {
  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ client, oneClient, projectID }) => {
            if (oneClient === undefined) {
              // tslint:disable-next-line no-null-keyword
              return null;
            }

            const onClick = () => {
              oneClient
                .executeTaskList({
                  plugin: '@neo-one/server-plugin-project',
                  options: {
                    command: 'reset',
                    projectID,
                  },
                })
                .then(() => {
                  client.reset();
                })
                .catch(addError);
            };

            return (
              <ToolbarButton
                data-test-button="neo-one-reset-button"
                data-test-tooltip="neo-one-reset-tooltip"
                help="Reset Network"
                onClick={onClick}
              >
                <div>
                  <MdRefresh />
                </div>
              </ToolbarButton>
            );
          }}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
