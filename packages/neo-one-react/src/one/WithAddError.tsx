import * as React from 'react';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';
import { WithAddToast } from './ToastsContainer';

export type AddError = (error: Error) => void;

const ErrorText = styled(Box)`
  color: ${prop('theme.error')};
`;

interface WithAddErrorProps {
  readonly children: (addError: AddError) => React.ReactNode;
}

// tslint:disable-next-line no-let
let mutableID = 0;

const StyledPre = styled.pre`
  white-space: pre;
  overflow-x: auto;
`;

export function WithAddError({ children }: WithAddErrorProps) {
  return (
    <WithAddToast>
      {(addToast) =>
        children((error) => {
          // tslint:disable-next-line no-console
          console.error(error.stack === undefined ? error : error.stack);
          addToast({
            id: `error:${mutableID}`,
            title: (
              <span data-test="neo-one-error-toast-title">
                <ErrorText as="span">Error.&nbsp;</ErrorText>
                <span>See console for more info.</span>
              </span>
            ),
            message: <StyledPre data-test="neo-one-error-toast-message">{error.message}</StyledPre>,
          });
          mutableID += 1;
        })
      }
    </WithAddToast>
  );
}
