import styled from '@emotion/styled';
import { Box, Button } from '@neo-one/react-common';
import * as React from 'react';
import { useResetLocalState } from './DeveloperToolsContext';

const Wrapper = styled(Box)`
  display: grid;
  justify-content: flex-end;
`;

export function ResetLocalStateButton() {
  const resetLocalState = useResetLocalState();

  return (
    <Wrapper>
      <Button data-test="neo-one-reset-local-state-button" onClick={resetLocalState}>
        Reset Local Storage
      </Button>
    </Wrapper>
  );
}
