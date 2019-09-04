// tslint:disable no-any
import styled from '@emotion/styled';
import { Box, Monogram, useHidden, useStream } from '@neo-one/react-common';
// @ts-ignore
import SizeObserver from '@render-props/size-observer';
import * as React from 'react';
import { ifProp, prop } from 'styled-tools';
import { BalanceSelector } from './BalanceSelector';
import { BlockIndex } from './BlockIndex';
import { BlockTime } from './BlockTime';
import { NEOTrackerButton } from './NEOTrackerButton';
import { ResetButton } from './ResetButton';
import { ResizeHandler } from './ResizeHandler';
import { SettingsButton } from './SettingsButton';
import { Toasts } from './Toasts';
import { ToolbarButton } from './ToolbarButton';
import { WalletButton } from './WalletButton';

const { useCallback, useState } = React;

const Wrapper = styled<typeof Box, { readonly active: boolean }>(Box)`
  display: flex;
  bottom: 0;
  left: 0;
  position: fixed;
  ${ifProp('active', 'transition: transform 0.5s ease-in-out')}
`;

const InnerWrapper = styled(Box)`
  display: flex;
  overflow-x: auto;
`;

const StyledMonogram = styled(Monogram)`
  &&& {
    height: 32px;
  }
`;

const StyledToolbarButton = styled(ToolbarButton)`
  background-color: ${prop('theme.black')};
  color: ${prop('theme.primary')};
  border: 1px solid ${prop('theme.gray5')};
  width: 40px;
  height: 40px;
  padding: 0;

  & ${/* sc-sel */ StyledMonogram} {
    opacity: 0.4;
    transition: opacity 0.15s ease-in-out;
  }

  &:hover ${/* sc-sel */ StyledMonogram} {
    opacity: 1;
  }

  &:active ${/* sc-sel */ StyledMonogram} {
    opacity: 1;
  }

  &:focus ${/* sc-sel */ StyledMonogram} {
    opacity: 1;
  }
`;

const ToolbarButtonWrapper = styled(Box)`
  display: grid;
  place-items: center;
  height: 38px;
  width: 38px;
`;

function MonogramButton({ visible, onClick, ...props }: { readonly visible: boolean; readonly onClick: () => void }) {
  return (
    <StyledToolbarButton
      data-test-button="neo-one-toolbar-toggle-button"
      data-test-tooltip="neo-one-toolbar-toggle-tooltip"
      help={visible ? 'Hide Toolbar' : 'Show Toolbar'}
      onClick={onClick}
      {...props}
    >
      <ToolbarButtonWrapper>
        <StyledMonogram />
      </ToolbarButtonWrapper>
    </StyledToolbarButton>
  );
}

interface Props {
  readonly resizeHandler: ResizeHandler;
}

export function Toolbar({ resizeHandler }: Props) {
  const { visible, toggle } = useHidden(false);
  const maxWidth = useStream(() => resizeHandler.maxWidth$, [resizeHandler], 40);
  const [active, setActive] = useState(false);

  const onClick = useCallback(
    (width: number) => () => {
      setActive(true);
      if (!visible) {
        resizeHandler.maximizeToolbar({
          type: 'px',
          id: 'toolbar',
          width: Math.min(width, maxWidth),
          height: 40,
        });
      } else {
        resizeHandler.minimizeToolbar();
      }
      toggle();
    },
    [visible, resizeHandler, toggle, maxWidth, setActive],
  );

  const onMouseEnter = useCallback(() => {
    setActive(true);
    resizeHandler.maximize({
      type: 'max',
      id: 'toolbarOnEnter',
    });
  }, [setActive]);

  return (
    <>
      <SizeObserver every={150}>
        {({ sizeRef, width }: any) => (
          <Wrapper
            ref={sizeRef}
            active={active}
            style={{
              transform: visible ? 'translate(0, 0)' : `translate(-${width - 40}px, 0)`,
              maxWidth,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={() => {
              resizeHandler.minimize('toolbarOnEnter');
            }}
          >
            <InnerWrapper>
              <BlockIndex />
              <BlockTime />
              <ResetButton />
              <WalletButton />
              <BalanceSelector />
              <NEOTrackerButton />
              <SettingsButton />
            </InnerWrapper>
            <MonogramButton visible={visible} onClick={onClick(width)} />
          </Wrapper>
        )}
      </SizeObserver>
      <Toasts resizeHandler={resizeHandler} />
    </>
  );
}
