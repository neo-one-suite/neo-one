// tslint:disable no-array-mutation
import * as React from 'react';
import { Base, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { Toast } from './Toast';
import { ToastsContext } from './ToastsContainer';

const Wrapper = styled(Base)`
  bottom: 8px;
  left: 80px;
  position: fixed;
  z-index: 1050;
`;

export function Toasts() {
  return (
    <ToastsContext.Consumer>
      {({ toasts$, removeToast }) => (
        <FromStream props$={toasts$}>
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
