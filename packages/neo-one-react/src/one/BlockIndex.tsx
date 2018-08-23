import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { Base, styled } from 'reakit';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import { FromStream } from '../FromStream';
import { WithNetworkClient } from './DeveloperToolsContext';
import { WithAddError } from './ErrorsContainer';
import { ToolbarButton } from './ToolbarButton';

const IndexWrapper = styled(Base)`
  width: ${({ index }: { readonly index: number }) => index.toString().length * 10}px;
`;

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
              <ToolbarButton help="Run Consensus" onClick={onClick}>
                <FromStream<number>
                  props$={client.block$.pipe(
                    map(({ block }) => block.index),
                    distinctUntilChanged(),
                    catchError((error: Error) => {
                      addError(error);

                      return of(0);
                    }),
                  )}
                >
                  {(index) => <IndexWrapper index={index}>{index}</IndexWrapper>}
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
