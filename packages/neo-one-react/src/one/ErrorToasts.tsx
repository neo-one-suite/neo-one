// tslint:disable no-array-mutation
import * as React from 'react';
import { Base, styled } from 'reakit';
import { ErrorsContainer } from './ErrorsContainer';
import { ErrorToast } from './ErrorToast';

const Wrapper = styled(Base)`
  bottom: 8px;
  left: 80px;
  position: fixed;
  z-index: 1050;
`;

export function ErrorToasts() {
  return (
    <ErrorsContainer>
      {({ errors, removeError }) => (
        <Wrapper>
          {[...errors].reverse().map((error) => (
            <ErrorToast key={error} error={error} removeError={removeError} />
          ))}
        </Wrapper>
      )}
    </ErrorsContainer>
  );
}
