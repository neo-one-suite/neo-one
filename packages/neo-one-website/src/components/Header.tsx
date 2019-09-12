// tslint:disable no-any
import styled from '@emotion/styled';
import { Box, Link, Logo, Toolbar, ToolbarContent, ToolbarFocusable } from '@neo-one/react-common';
import * as React from 'react';
import { ifProp, prop, withProp } from 'styled-tools';
import { StyledRouterLinkBase } from './StyledRouterLink';

const Wrapper = styled(Box)`
  display: flex;
  width: 100%;
  justify-content: center;
  background-color: ${prop('theme.primary')};
  z-index: 9999;
  padding: 0 8px;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    padding: 0 36px;
  }
`;

const StyledToolbar = styled(Toolbar)`
  && {
    height: 100%;
    grid-gap: 8px;
    padding: 0 8px;
    overflow-x: auto;
  }

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    padding: 0 16px;
  }
`;

const LogoLink = styled(StyledRouterLinkBase)`
  display: block;
  margin-right: 0;
  margin-bottom: 8px;
  margin-top: 8px;
  height: 56px;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    margin-right: 36px;
    margin-bottom: 8px;
    margin-top: 12px;
  }
`;

const NavigationLink = styled<typeof StyledRouterLinkBase, { readonly active: boolean }>(StyledRouterLinkBase)`
  display: flex;
  align-items: center;
  ${prop('theme.fontStyles.headline')};
  height: 100%;
  padding-top: 5px;
  ${ifProp(
    'active',
    withProp('theme.accent', (color) => `color: ${color};`),
  )};
  border-bottom: 5px solid ${ifProp('active', prop('theme.accent'), 'transparent')};
  text-decoration: none;

  &:hover {
    color: ${prop('theme.accent')};
  }

  &:focus {
    color: ${prop('theme.accent')};
  }

  &.active {
    color: ${prop('theme.accent')};
  }
`;

const FocusableLink = ToolbarFocusable.withComponent(Link);

const GitHubLink = styled(FocusableLink)`
  @media (max-width: ${prop('theme.breakpoints.sm')}) {
    display: none;
  }
`;

const CourseLink = styled(NavigationLink)`
  @media (max-width: ${prop('theme.breakpoints.sm')}) {
    display: none;
  }
`;

const LeftHeader = styled(ToolbarContent)`
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly path: string;
}

export const Header = ({ path, ...props }: Props & React.ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <LeftHeader>
        <ToolbarFocusable>
          <LogoLink data-test="header-logo" to="/" linkColor="gray">
            <Logo />
          </LogoLink>
        </ToolbarFocusable>
        <ToolbarFocusable>
          <NavigationLink linkColor="gray" active={path === 'docs'} data-test="header-docs" to="/docs/getting-started">
            Docs
          </NavigationLink>
        </ToolbarFocusable>
        <ToolbarFocusable>
          <CourseLink linkColor="gray" active={path === 'course'} data-test="header-course" to="/course">
            Course
          </CourseLink>
        </ToolbarFocusable>
        <ToolbarFocusable>
          <NavigationLink linkColor="gray" active={path === 'tutorial'} data-test="header-tutorial" to="/tutorial">
            Tutorial
          </NavigationLink>
        </ToolbarFocusable>
        <ToolbarFocusable>
          <NavigationLink linkColor="gray" active={path === 'blog'} data-test="header-blog" to="/blog">
            Blog
          </NavigationLink>
        </ToolbarFocusable>
        <ToolbarFocusable>
          <NavigationLink linkColor="gray" active={path === 'reference'} data-test="header-reference" to="/reference">
            Reference
          </NavigationLink>
        </ToolbarFocusable>
      </LeftHeader>
      <ToolbarContent align="end">
        <GitHubLink
          linkColor="gray"
          data-test="header-github"
          href="https://github.com/neo-one-suite/neo-one"
          target="_blank"
        >
          GitHub
        </GitHubLink>
      </ToolbarContent>
    </StyledToolbar>
  </Wrapper>
);
