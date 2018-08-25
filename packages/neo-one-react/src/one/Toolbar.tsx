import * as React from 'react';
import { Block, Flex, Hidden, Shadow, styled } from 'reakit';
import { prop } from 'styled-tools';
import { ComponentProps } from '../types';
import { BalanceSelector } from './BalanceSelector';
import { BlockIndex } from './BlockIndex';
import { BlockTime } from './BlockTime';
import { Monogram } from './Monogram';
import { NEOTrackerButton } from './NEOTrackerButton';
import { NetworkSelector } from './NetworkSelector';
import { ResetButton } from './ResetButton';
import { SecondsPerBlockInput } from './SecondsPerBlockInput';
import { SettingsButton } from './SettingsButton';
import { Toasts } from './Toasts';
import { ToolbarButton } from './ToolbarButton';
import { WalletButton } from './WalletButton';

const Wrapper = styled(Flex)`
  background-color: ${prop('theme.gray0')};
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  bottom: 0;
  position: fixed;
  right: 16px;
`;

interface HiddenProps {
  readonly visible: boolean;
}

const StyledMonogram = styled(Monogram)`
  /* stylelint-disable-next-line */
`;

const StyledToolbarButton = styled(ToolbarButton)`
  bottom: 8px;
  position: fixed;
  left: 8px;
  background-color: ${prop('theme.black')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 48px;
  color: ${prop('theme.primary')};
  width: 48px;
  height: 48px;
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

function MonogramButton(visible: boolean) {
  return (props: ComponentProps<typeof ToolbarButton>) => (
    <StyledToolbarButton help={visible ? 'Hide Toolbar' : 'Show Toolbar'} delay="1s" {...props}>
      <Shadow />
      <Block width={32} height={32}>
        <StyledMonogram width={32} height={32} />
      </Block>
    </StyledToolbarButton>
  );
}

export function Toolbar() {
  return (
    <Hidden.Container>
      {(hidden: HiddenProps) => (
        <>
          <Hidden as={Wrapper} slide="top" {...hidden}>
            <NetworkSelector />
            <BlockIndex />
            <BlockTime />
            <ResetButton />
            <SecondsPerBlockInput />
            <WalletButton />
            <BalanceSelector />
            <SettingsButton />
            <NEOTrackerButton />
          </Hidden>
          <Hidden.Toggle as={MonogramButton(hidden.visible)} {...hidden} />
          <Toasts />
        </>
      )}
    </Hidden.Container>
  );
}
