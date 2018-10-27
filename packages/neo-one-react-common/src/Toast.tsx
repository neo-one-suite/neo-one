import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { Box, Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { IconButton } from './IconButton';
import { Shadow } from './Shadow';
import { Toast as ToastType } from './ToastsContainer';

// tslint:disable-next-line no-any
type HiddenProps = any;

const Wrapper = styled(Grid)`
  gap: 8px;
  background-color: ${prop('theme.gray0')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 0.25em;
  margin-top: 8px;
  width: 400px;
`;

const ToastWrapper = styled(Box)`
  padding: 8px;
`;

const ToastHeading = styled(Grid)`
  grid-auto-flow: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
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
  let once = false;
  let autoHideTimer: number | undefined;

  return (
    <Hidden.Container>
      {(hidden: HiddenProps) => {
        const hide = () => {
          hidden.hide();
          setTimeout(() => removeToast(toast.id), 250);

          if (autoHideTimer !== undefined) {
            clearTimeout(autoHideTimer);
          }
        };
        if (!hidden.visible && !once) {
          once = true;
          setTimeout(() => {
            hidden.show();
            if (toast.autoHide !== undefined) {
              autoHideTimer = setTimeout(() => {
                hide();
                // tslint:disable-next-line no-any
              }, toast.autoHide) as any;
            }
          }, 500);
        }

        return (
          <Hidden fade {...hidden}>
            <Wrapper>
              <Shadow />
              <ToastHeading data-test="neo-one-toast-heading">
                {toast.title}
                <StyledIconButton data-test="neo-one-toast-close-button" onClick={hide}>
                  <MdClose />
                </StyledIconButton>
              </ToastHeading>
              <ToastWrapper data-test="neo-one-toast-wrapper">{toast.message}</ToastWrapper>
            </Wrapper>
          </Hidden>
        );
      }}
    </Hidden.Container>
  );
}
