// tslint:disable no-any
import { Monogram, Shadow, Toasts } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Flex, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { ComponentProps } from '../types';
import { BalanceSelector } from './BalanceSelector';
import { BlockIndex } from './BlockIndex';
import { BlockTime } from './BlockTime';
import { NEOTrackerButton } from './NEOTrackerButton';
import { ResetButton } from './ResetButton';
import { SettingsButton } from './SettingsButton';
import { ToolbarButton } from './ToolbarButton';
import { WalletButton } from './WalletButton';

const Wrapper = styled(Flex)`
  background-color: ${prop('theme.black')};
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  bottom: 0;
  position: fixed;
  right: 2px;
`;

const StyledMonogram = styled(Monogram)`
  &&& {
    height: 32px;
  }
`;

const StyledToolbarButton = styled(ToolbarButton)`
  bottom: 8px;
  position: fixed;
  left: 8px;
  background-color: ${prop('theme.black')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 34px;
  color: ${prop('theme.primary')};
  width: 34px;
  height: 34px;
  padding: 0;
  transform: translate(0, 0) scale(1);
  transition: transform 0.15s ease-in-out;

  & ${/* sc-sel */ StyledMonogram} {
    opacity: 0.4;
    transition: opacity 0.15s ease-in-out;
  }

  &:hover {
    transform: translate(0, -2px) scale(1);
  }

  &:hover ${/* sc-sel */ StyledMonogram} {
    opacity: 1;
  }
`;

const ToolbarButtonWrapper = styled(Box)`
  height: 32px;
  width: 32px;
`;

function MonogramButton(visible: boolean) {
  return (props: ComponentProps<typeof ToolbarButton>) => (
    <StyledToolbarButton
      data-test-button="neo-one-toolbar-toggle-button"
      data-test-tooltip="neo-one-toolbar-toggle-tooltip"
      help={visible ? 'Hide Toolbar' : 'Show Toolbar'}
      delay="1s"
      {...props}
    >
      <Shadow />
      <ToolbarButtonWrapper>
        <StyledMonogram />
      </ToolbarButtonWrapper>
    </StyledToolbarButton>
  );
}

export function Toolbar() {
  return (
    <Hidden.Container>
      {(hidden) => (
        <>
          <Hidden as={Wrapper as any} slide="top" {...hidden}>
            <BlockIndex />
            <BlockTime />
            <ResetButton />
            <WalletButton />
            <BalanceSelector />
            <SettingsButton />
            <NEOTrackerButton />
          </Hidden>
          <Hidden.Toggle as={MonogramButton(hidden.visible) as any} {...hidden} />
          <Toasts />
        </>
      )}
    </Hidden.Container>
  );
}
