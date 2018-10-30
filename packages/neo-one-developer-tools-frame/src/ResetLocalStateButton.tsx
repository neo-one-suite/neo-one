import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { WithResetLocalState } from './DeveloperToolsContext';

const Wrapper = styled(Grid)`
  justify-content: flex-end;
`;

export function ResetLocalStateButton() {
  return (
    <WithResetLocalState>
      {(resetLocalState) => (
        <Wrapper>
          <Button data-test="neo-one-reset-local-state-button" onClick={resetLocalState}>
            Reset Local Storage
          </Button>
        </Wrapper>
      )}
    </WithResetLocalState>
  );
}
