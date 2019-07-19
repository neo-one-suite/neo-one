import styled from '@emotion/styled';
// tslint:disable no-null-keyword
import { Box, Hidden, IconButton, Shadow, useHidden } from '@neo-one/react-common';
import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { prop } from 'styled-tools';
import { Toast as ToastType } from './ToastsContext';

const { useEffect, useCallback } = React;

const Wrapper = styled(Box)`
  display: grid;
  gap: 8px;
  background-color: ${prop('theme.gray0')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 0.25em;
  margin-top: 8px;
  width: 400px;
`;

const ToastWrapper = styled(Box)`
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  min-width: 0;
`;

const ToastHeading = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
`;

const StyledIconButton = styled(IconButton)`
  border-radius: 35;
  margin-right: -4;
  margin-top: -4;
`;

interface Props {
  readonly toast: ToastType;
  readonly removeToast: (toast: string) => void;
}
export function Toast({ toast, removeToast }: Props) {
  const { visible, show, hide: hideIn } = useHidden(false);
  const hide = useCallback(() => {
    hideIn();
    setTimeout(() => removeToast(toast.id), 250);
  }, [hideIn]);
  useEffect(() => {
    let autoHideTimer: number | undefined;
    const showTimer = setTimeout(() => {
      show();
      if (toast.autoHide !== undefined) {
        autoHideTimer = setTimeout(() => {
          hide();
          // tslint:disable-next-line no-any
        }, toast.autoHide) as any;
      }
      // tslint:disable-next-line no-any
    }, 500) as any;

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoHideTimer);
    };
  }, [show, visible]);

  return (
    <Hidden fade visible={visible}>
      <Wrapper>
        <Shadow />
        <ToastHeading data-test="neo-one-toast-heading">
          {toast.title}
          <StyledIconButton data-test="neo-one-toast-close-button" onClick={hide}>
            <MdClose />
          </StyledIconButton>
        </ToastHeading>
        {toast.message === undefined ? null : (
          <ToastWrapper data-test="neo-one-toast-wrapper">{toast.message}</ToastWrapper>
        )}
      </Wrapper>
    </Hidden>
  );
}
