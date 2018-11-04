// tslint:disable no-array-mutation no-any
import { FromStream } from '@neo-one/react';
// @ts-ignore
import SizeObserver from '@render-props/size-observer';
import * as React from 'react';
import { styled } from 'reakit';
import { ResizeHandler } from './ResizeHandler';
import { Toast } from './Toast';
import { ToastsContext, ToastsContextType } from './ToastsContainer';

const Wrapper = styled.div`
  bottom: 48px;
  left: 24px;
  position: fixed;
  z-index: 1050;
`;

interface Props {
  readonly resizeHandler: ResizeHandler;
}

export function Toasts({ resizeHandler }: Props) {
  return (
    <ToastsContext.Consumer>
      {({ toasts$, removeToast }: ToastsContextType) => (
        <SizeObserver
          onChange={({ width, height }: { width: number; height: number }) => {
            if (width === 0 && height === 0) {
              resizeHandler.minimize('toasts');
            } else {
              resizeHandler.maximize({
                type: 'px',
                id: 'toasts',
                width: width + 80,
                height: height + 48,
              });
            }
          }}
        >
          {({ sizeRef }: any) => (
            <FromStream createStream={() => toasts$} props={[toasts$]}>
              {(toasts) => (
                <Wrapper innerRef={sizeRef}>
                  {[...toasts].reverse().map((toast) => (
                    <Toast key={toast.id} toast={toast} removeToast={removeToast} />
                  ))}
                </Wrapper>
              )}
            </FromStream>
          )}
        </SizeObserver>
      )}
    </ToastsContext.Consumer>
  );
}
