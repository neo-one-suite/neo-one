// tslint:disable no-any
import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { as, Flex, styled, Toolbar } from 'reakit';
import { prop } from 'styled-tools';
import { Logo } from '../elements';
import { ComponentProps } from '../types';

const Wrapper = styled(Flex)`
  width: 100%;
  justify-content: center;
  background-color: ${prop('theme.primary')};
  z-index: 9999;
  padding: 0 36px;

  @media (max-width: 768px) {
    padding: 0 8px;
  }
`;

const StyledToolbar = styled(Toolbar)`
  && {
    height: 100%;
    grid-gap: 8px;
    padding: 0 16px;
  }

  ${/* sc-sel */ Toolbar.Focusable as any} {
    outline: none;
  }

  @media (max-width: 768px) {
    padding: 0 8px;
  }
`;

const FocusableRouterLink = as(RouterLink)(Toolbar.Focusable);

const LogoLink = styled(FocusableRouterLink)`
  display: block;
  margin-right: 36px;
  margin-bottom: 12px;
  margin-top: 12px;
  height: 56px;

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 8px;
    margin-top: 8px;
  }
`;

const NavigationLink = styled(FocusableRouterLink)`
  display: flex;
  align-items: center;
  font-size: 20px;
  height: 100%;
  padding-top: 5px;
  border-bottom: 5px solid transparent;
  color: ${prop('theme.black')};
  text-decoration: none;

  &:hover {
    border-color: ${prop('theme.accent')};
    color: ${prop('theme.accent')};
  }

  &.active {
    border-color: ${prop('theme.accent')};
  }
`;

const FocusableLink: any = as(Link as any)(Toolbar.Focusable);

export const Header = (props: ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <Toolbar.Content>
        <LogoLink data-test="header-logo" to="/">
          <Logo />
        </LogoLink>
        <NavigationLink data-test="header-tutorial" to="/tutorial">
          Tutorial
        </NavigationLink>
        <NavigationLink data-test="header-tutorial" to="/course">
          Course
        </NavigationLink>
      </Toolbar.Content>
      <Toolbar.Content align="end">
        <FocusableLink
          linkColor="gray"
          data-test="header-github"
          href="https://github.com/neo-one-suite/neo-one"
          target="_blank"
        >
          GitHub
        </FocusableLink>
      </Toolbar.Content>
    </StyledToolbar>
  </Wrapper>
);
