import { Box, useStream } from '@neo-one/react-common';
import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import styled from 'styled-components';
import { useNetworkClients } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { ToolbarButton } from './ToolbarButton';

const { useCallback } = React;

const IndexWrapper = styled(Box)`
  width: ${({ index }: { readonly index: number }) => index.toString().length * 10}px;
`;

export function BlockIndex() {
  const addError = useAddError();
  const { block$, developerClient } = useNetworkClients();
  const onClick = useCallback(
    () => {
      if (developerClient !== undefined) {
        developerClient.runConsensusNow().catch(addError);
      }
    },
    [developerClient, addError],
  );
  const index = useStream(
    () =>
      block$.pipe(
        map(({ block }) => block.index),
        distinctUntilChanged(),
        catchError((error: Error) => {
          addError(error);

          return of(0);
        }),
      ),
    [block$, addError],
    0,
  );

  return (
    <ToolbarButton
      data-test-button="neo-one-block-index-button"
      data-test-tooltip="neo-one-block-index-tooltip"
      help="Run Consensus"
      onClick={onClick}
    >
      <IndexWrapper data-test="neo-one-block-index-value" index={index}>
        {index}
      </IndexWrapper>
      <MdPlayArrow />
    </ToolbarButton>
  );
}
