import { Client } from '@neo-one/client';
import { AddError, FromStream, WithAddError } from '@neo-one/react-common';
import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { Box, styled } from 'reakit';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import { WithNetworkClient } from './DeveloperToolsContext';
import { ToolbarButton } from './ToolbarButton';

const IndexWrapper = styled(Box)`
  width: ${({ index }: { readonly index: number }) => index.toString().length * 10}px;
`;

const createIndex$ = ({ addError, client }: { readonly addError: AddError; readonly client: Client }) =>
  client.block$.pipe(
    map(({ block }) => block.index),
    distinctUntilChanged(),
    catchError((error: Error) => {
      addError(error);

      return of(0);
    }),
  );

export function BlockIndex() {
  return (
    <WithAddError>
      {(addError) => (
        <WithNetworkClient>
          {({ client, developerClient }) => {
            const onClick =
              developerClient === undefined
                ? undefined
                : () => {
                    developerClient.runConsensusNow().catch(addError);
                  };

            return (
              <ToolbarButton
                data-test-button="neo-one-block-index-button"
                data-test-tooltip="neo-one-block-index-tooltip"
                help="Run Consensus"
                onClick={onClick}
              >
                <FromStream props={{ client, addError }} createStream={createIndex$}>
                  {(index) => (
                    <IndexWrapper data-test="neo-one-block-index-value" index={index}>
                      {index}
                    </IndexWrapper>
                  )}
                </FromStream>
                <MdPlayArrow />
              </ToolbarButton>
            );
          }}
        </WithNetworkClient>
      )}
    </WithAddError>
  );
}
