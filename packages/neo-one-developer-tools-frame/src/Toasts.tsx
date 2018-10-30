// tslint:disable no-array-mutation
import { FromStream } from '@neo-one/react';
import * as React from 'react';
import { Box, styled } from 'reakit';
import { Toast } from './Toast';
import { ToastsContext, ToastsContextType } from './ToastsContainer';

const Wrapper = styled(Box)`
  bottom: 48px;
  left: 80px;
  position: fixed;
  z-index: 1050;
`;

export function Toasts() {
  return (
    <ToastsContext.Consumer>
      {({ toasts$, removeToast }: ToastsContextType) => (
        <FromStream createStream={() => toasts$} props={[toasts$]}>
          {(toasts) => (
            <Wrapper>
              {[...toasts].reverse().map((toast) => (
                <Toast key={toast.id} toast={toast} removeToast={removeToast} />
              ))}
            </Wrapper>
          )}
        </FromStream>
      )}
    </ToastsContext.Consumer>
  );
}
