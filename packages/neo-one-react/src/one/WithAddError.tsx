import * as React from 'react';
import { Base, styled } from 'reakit';
import { prop } from 'styled-tools';
import { WithAddToast } from './ToastsContainer';

type AddError = (error: Error) => void;

const ErrorText = styled(Base)`
  color: ${prop('theme.error')};
`;

interface WithAddErrorProps {
  readonly children: (addError: AddError) => React.ReactNode;
}

// tslint:disable-next-line no-let
let mutableID = 0;

export function WithAddError({ children }: WithAddErrorProps) {
  return (
    <WithAddToast>
      {(addToast) =>
        children((error) => {
          // tslint:disable-next-line no-console
          console.error(error);
          addToast({
            id: `error:${mutableID}`,
            title: (
              <span>
                <ErrorText as="span">Error.&nbsp;</ErrorText>
                <span>See console for more info.</span>
              </span>
            ),
            message: error.message,
          });
          mutableID += 1;
        })
      }
    </WithAddToast>
  );
}
