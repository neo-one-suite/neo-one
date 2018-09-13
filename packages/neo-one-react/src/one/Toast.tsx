import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { Box, Button, Flex, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { BoxWithBorder } from './BoxWithBorder';
import { Shadow } from './Shadow';
import { Toast as ToastType } from './ToastsContainer';

// tslint:disable-next-line no-any
type HiddenProps = any;

const StyledBox = styled(Box)`
  background-color: ${prop('theme.gray0')};
  margin-top: 8px;
  width: 400px;
`;

const ToastWrapper = styled(BoxWithBorder)`
  margin: 8px;
`;

const ToastHeading = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  margin: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  padding-bottom: 8px;
`;

interface Props {
  readonly toast: ToastType;
  readonly removeToast: (toast: string) => void;
}
export function Toast({ toast, removeToast }: Props) {
  let once = false;
  let autoHideTimer: NodeJS.Timer | undefined;

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
              }, toast.autoHide);
            }
          }, 500);
        }

        return (
          <Hidden fade {...hidden}>
            <StyledBox>
              <Shadow />
              <ToastHeading data-test="neo-one-toast-heading">
                {toast.title}
                <Button
                  data-test="neo-one-toast-close-button"
                  fontSize={14}
                  onClick={hide}
                  border="none"
                  backgroundColor="transparent"
                  borderRadius={35}
                  marginRight={-4}
                  marginTop={-4}
                >
                  <MdClose />
                </Button>
              </ToastHeading>
              <ToastWrapper data-test="neo-one-toast-wrapper">{toast.message}</ToastWrapper>
            </StyledBox>
          </Hidden>
        );
      }}
    </Hidden.Container>
  );
}
