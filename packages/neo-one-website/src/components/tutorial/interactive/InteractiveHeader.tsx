import * as React from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { Flex, styled, Toolbar } from 'reakit';
import { prop } from 'styled-tools';
import { LineLogo } from '../../../elements';
import { ComponentProps } from '../../../types';

const Wrapper = styled(Flex)`
  width: 100%;
  justify-content: center;
  background-color: ${prop('theme.primary')};
  padding: 0 8px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding: 0 8px;
  }
`;

const StyledToolbar = styled(Toolbar)`
  height: 100%;
  grid-gap: 8px;
  padding: 0 8px;

  ${/* sc-sel */ Toolbar.Focusable} {
    outline: none;
  }
`;

const LogoLink = styled(RouterLink)`
  display: block;
  margin-right: 24px;
  margin-bottom: 8px;
  margin-top: 8px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    margin-right: 8px;
  }
`;

export const InteractiveHeader = (props: ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <Toolbar.Content>
        <Toolbar.Focusable data-test="header-logo" as={LogoLink} to="/">
          <LineLogo />
        </Toolbar.Focusable>
      </Toolbar.Content>
    </StyledToolbar>
  </Wrapper>
);
