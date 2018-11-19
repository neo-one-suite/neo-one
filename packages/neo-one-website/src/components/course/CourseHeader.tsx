// tslint:disable no-any
import { Box, LineLogoPrimary, Link, Toolbar, ToolbarContent, ToolbarFocusable } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { RouterLink } from '../RouterLink';

const Wrapper = styled(Box)`
  display: flex;
  width: 100%;
  justify-content: center;
  background-color: ${prop('theme.black')};
  padding: 0 8px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding: 0 8px;
  }
`;

const StyledToolbar = styled(Toolbar)`
  &&& {
    height: 100%;
    grid-gap: 8px;
    padding: 0 8px;
  }

  ${/* sc-sel */ ToolbarFocusable as any} {
    outline: none;
  }
`;

const FocusableRouterLink = ToolbarFocusable.withComponent(RouterLink);

const LogoLink = styled(FocusableRouterLink)`
  display: block;
  margin-right: 24px;
  margin-bottom: 16px;
  margin-top: 16px;
  height: 24px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    margin-right: 8px;
  }
`;

const FocusableLink: any = ToolbarFocusable.withComponent(Link);

export const CourseHeader = (props: React.ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <ToolbarContent>
        <LogoLink to="/course">
          <LineLogoPrimary />
        </LogoLink>
      </ToolbarContent>
      <ToolbarContent align="end">
        <FocusableLink linkColor="primary" href="/" target="_blank">
          Docs
        </FocusableLink>
      </ToolbarContent>
    </StyledToolbar>
  </Wrapper>
);
