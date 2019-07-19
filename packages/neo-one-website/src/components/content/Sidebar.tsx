import { keyframes } from '@emotion/core';
import styled from '@emotion/styled';
import { Box, ButtonBase, Hidden, useHidden } from '@neo-one/react-common';
import * as React from 'react';
import { MdClose, MdUnfoldMore } from 'react-icons/md';
import { prop } from 'styled-tools';
import { SectionData } from '../../types';
import { SidebarSpacer } from '../common';
import { SidebarList } from './SidebarList';

const Wrapper = styled(Box)``;

const DesktopSidebarWrapper = styled(Box)`
  background-color: ${prop('theme.gray1')};
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  margin-right: -1000px;
  padding-right: 1000px;
  padding-top: 72px;
  top: 0;
  z-index: 2;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    padding-top: 80px;
  }
`;

const MobileWrapper = styled(Box)`
  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    display: none;
  }
`;

const fadeSlideIn = keyframes`
  0% {
    transform: translateY(40px);
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
`;

const fadeSlideOut = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    transform: translateY(40px);
    opacity: 0;
  }
`;

const StyledHidden = styled(Hidden)`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  height: 100vh;
  overflow-y: auto;

  &[aria-hidden='false'] {
    animation: ${fadeSlideIn} 500ms;
  }

  &[aria-hidden='true'] {
    animation: ${fadeSlideOut} 500ms;
  }
`;

const MobileSidebarWrapper = styled(Box)`
  width: 100%;
  background-color: ${prop('theme.gray1')};
`;

const MobileButton = styled(ButtonBase)`
  position: fixed;
  bottom: 48px;
  right: 24px;
  background-color: ${prop('theme.black')};
  border: 1px solid ${prop('theme.gray4')};
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  border-radius: 64px;
  color: ${prop('theme.primary')};
  width: 64px;
  height: 64px;
  padding: 0;
  transform: translate(0, 0) scale(1);
  transition: transform 0.15s ease-in-out;
  cursor: pointer;
  outline: none;
  z-index: 5;

  &:hover {
    transform: translate(0, -2px) scale(1);
  }

  &:active {
    transform: translate(0, -2px) scale(1);
  }

  &:focus {
    transform: translate(0, -2px) scale(1);
  }
`;

const IconWrapper = styled(Box)`
  display: grid;
  width: 100%;
  height: 100%;
  justify-items: center;
  align-items: center;

  & > svg {
    width: 32px;
    height: 32px;
  }
`;

interface Props {
  readonly current: string;
  readonly alwaysVisible: boolean;
  readonly sections: readonly SectionData[];
}

export const Sidebar = ({ current, alwaysVisible, sections, ...props }: Props) => {
  const { visible, hide, toggle } = useHidden();

  return (
    <Wrapper {...props}>
      <SidebarSpacer>
        <DesktopSidebarWrapper>
          <SidebarList current={current} alwaysVisible={alwaysVisible} sections={sections} />
        </DesktopSidebarWrapper>
      </SidebarSpacer>
      <MobileWrapper>
        <StyledHidden visible={visible} animated unmount>
          <MobileSidebarWrapper>
            <SidebarList current={current} alwaysVisible sections={sections} onClickLink={hide} />
          </MobileSidebarWrapper>
        </StyledHidden>
        <MobileButton onClick={toggle}>
          <IconWrapper>{visible ? <MdClose /> : <MdUnfoldMore />}</IconWrapper>
        </MobileButton>
      </MobileWrapper>
    </Wrapper>
  );
};
