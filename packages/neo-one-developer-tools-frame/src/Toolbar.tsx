// tslint:disable no-any
import { FromStream, Monogram } from '@neo-one/react-common';
// @ts-ignore
import SizeObserver from '@render-props/size-observer';
import * as React from 'react';
import { Flex, Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
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

const Wrapper = styled.div<{ readonly maxWidth: number }>`
  display: flex;
  bottom: 0;
  left: 0;
  position: fixed;
  transition: transform 0.5s ease-in-out;
  max-width: ${prop('maxWidth')}px;
`;

const InnerWrapper = styled(Flex)`
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

const ToolbarButtonWrapper = styled(Grid)`
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
  return (
    <Hidden.Container>
      {(hidden) => (
        <>
          <SizeObserver>
            {({ sizeRef, width }: any) => (
              <FromStream props={[resizeHandler]} createStream={() => resizeHandler.maxWidth$}>
                {(maxWidth) => (
                  <Wrapper
                    innerRef={sizeRef}
                    maxWidth={maxWidth}
                    style={{ transform: hidden.visible ? 'translate(0, 0)' : `translate(-${width - 40}px, 0)` }}
                    onMouseEnter={() => {
                      resizeHandler.maximize({
                        type: 'max',
                        id: 'toolbarOnEnter',
                      });
                    }}
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
                    <MonogramButton
                      visible={hidden.visible}
                      onClick={() => {
                        if (hidden.visible) {
                          resizeHandler.minimizeToolbar();
                        } else {
                          resizeHandler.maximizeToolbar({
                            type: 'px',
                            id: 'toolbar',
                            width: Math.min(width, maxWidth),
                            height: 40,
                          });
                        }
                        hidden.toggle();
                      }}
                    />
                  </Wrapper>
                )}
              </FromStream>
            )}
          </SizeObserver>
          <Toasts resizeHandler={resizeHandler} />
        </>
      )}
    </Hidden.Container>
  );
}
