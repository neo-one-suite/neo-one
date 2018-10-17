import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { Flex, styled } from 'reakit';
import { WithResetLocalState } from './DeveloperToolsContext';

const Wrapper = styled(Flex)`
  justify-content: flex-end;
  margin: 16px 0;
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
