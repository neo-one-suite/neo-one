// tslint:disable no-any
import {
  Backdrop,
  Box,
  H3,
  IconButton,
  Overlay,
  Portal,
  Shadow,
  useHidden,
  UseHiddenProps,
} from '@neo-one/react-common';
import * as React from 'react';
import { MdClose } from 'react-icons/md';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { ResizeHandlerContext } from './ResizeHandlerContext';

const { useContext, useCallback } = React;

const StyledHeader = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  background-color: ${prop('theme.primary')};
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 16px;
`;

const StyledHeading = styled(H3)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.headline')};
  margin: 0;
`;

const StyledBody = styled(Box)`
  display: grid;
  gap: 8px;
  background-color: ${prop('theme.gray0')};
  padding: 16px;
`;

const StyledIconButton = styled(IconButton)`
  font-size: 20px;
  border-radius: 50;
`;

const StyledCardFit = styled(Box)`
  display: grid;
`;

interface Props {
  readonly title: string;
  readonly renderDialog: (overlay: UseHiddenProps) => React.ReactNode;
  readonly children: (overlay: UseHiddenProps) => React.ReactNode;
  readonly 'data-test-heading': string;
  readonly 'data-test-close-button': string;
}

export function Dialog({
  'data-test-heading': dataTestHeading,
  'data-test-close-button': dataTestCloseButton,
  children,
  renderDialog,
  title,
}: Props) {
  const resizeHandler = useContext(ResizeHandlerContext);
  const [visible, showIn, hideIn, toggleIn] = useHidden(false);
  const show = useCallback(
    () => {
      resizeHandler.maximize({ type: 'max', id: 'dialog' });
      showIn();
    },
    [showIn],
  );
  const hide = useCallback(
    () => {
      resizeHandler.minimize('dialog');
      hideIn();
    },
    [hideIn],
  );
  const toggle = useCallback(
    () => {
      if (visible) {
        resizeHandler.minimize('dialog');
      } else {
        resizeHandler.maximize({ type: 'max', id: 'dialog' });
      }
      toggleIn();
    },
    [visible, toggleIn],
  );

  const overlay = { visible, show, hide, toggle };

  return (
    <>
      {children(overlay)}
      <Portal>
        <Backdrop onClick={hide} />
        <Overlay unmount slide fade visible={visible}>
          <Shadow />
          <StyledCardFit>
            <StyledHeader>
              <StyledHeading data-test={dataTestHeading}>{title}</StyledHeading>
              <StyledIconButton data-test={dataTestCloseButton} onClick={overlay.hide}>
                <MdClose />
              </StyledIconButton>
            </StyledHeader>
            <StyledBody>{renderDialog(overlay)}</StyledBody>
          </StyledCardFit>
        </Overlay>
      </Portal>
    </>
  );
}
