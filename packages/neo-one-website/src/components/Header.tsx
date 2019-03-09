// tslint:disable no-any
import { Box, Link, LinkBase, Logo, Toolbar, ToolbarContent, ToolbarFocusable, use } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { ifProp, prop, withProp } from 'styled-tools';
import { RouterLink } from './RouterLink';

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

  ${/* sc-sel */ ToolbarFocusable} {
    outline: none;
  }

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    padding: 0 16px;
  }
`;

const FocusableRouterLink = use(ToolbarFocusable, RouterLink, LinkBase);

const LogoLink = styled(FocusableRouterLink)`
  display: block;
  margin-right: 0;
  margin-bottom: 8px;
  margin-top: 8px;
  height: 56px;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    margin-right: 36px;
    margin-bottom: 12px;
    margin-top: 12px;
  }
`;

const NavigationLink: any = styled(FocusableRouterLink)<{ readonly active: boolean }>`
  display: flex;
  align-items: center;
  ${prop('theme.fontStyles.headline')};
  height: 100%;
  padding-top: 5px;
  ${ifProp('active', withProp('theme.accent', (color) => `color: ${color};`))};
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

const FocusableLink: any = ToolbarFocusable.withComponent(Link);

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
        <LogoLink linkColor="gray" data-test="header-logo" to="/">
          <Logo />
        </LogoLink>
        <NavigationLink linkColor="gray" active={path === 'docs'} data-test="header-docs" to="/docs/getting-started">
          Docs
        </NavigationLink>
        <CourseLink linkColor="gray" active={path === 'course'} data-test="header-course" to="/course">
          Course
        </CourseLink>
        <NavigationLink linkColor="gray" active={path === 'tutorial'} data-test="header-tutorial" to="/tutorial">
          Tutorial
        </NavigationLink>
        <NavigationLink linkColor="gray" active={path === 'blog'} data-test="header-blog" to="/blog">
          Blog
        </NavigationLink>
        <NavigationLink linkColor="gray" active={path === 'reference'} data-test="header-reference" to="/reference">
          Reference
        </NavigationLink>
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
