// tslint:disable no-array-mutation no-any
// @ts-ignore
import SizeObserver from '@render-props/size-observer';
import * as React from 'react';
import styled from 'styled-components';
import { ResizeHandler } from './ResizeHandler';
import { Toast } from './Toast';
import { useToasts } from './ToastsContext';

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
      {({ sizeRef }: any) => {
        // tslint:disable-next-line:no-unused
        const [toasts, _addToast, removeToast] = useToasts();

        return (
          <Wrapper ref={sizeRef}>
            {[...toasts].reverse().map((toast) => (
              <Toast key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
          </Wrapper>
        );
      }}
    </SizeObserver>
  );
}
