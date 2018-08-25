// tslint:disable no-array-mutation
import * as React from 'react';
import { Base, styled } from 'reakit';
import { Toast } from './Toast';
import { ToastsContainer } from './ToastsContainer';

const Wrapper = styled(Base)`
  bottom: 8px;
  left: 80px;
  position: fixed;
  z-index: 1050;
`;

export function Toasts() {
  return (
    <ToastsContainer>
      {({ toasts, removeToast }) => (
        <Wrapper>
          {[...toasts].reverse().map((toast) => (
            <Toast key={toast.id} toast={toast} removeToast={removeToast} />
          ))}
        </Wrapper>
      )}
    </ToastsContainer>
  );
}
