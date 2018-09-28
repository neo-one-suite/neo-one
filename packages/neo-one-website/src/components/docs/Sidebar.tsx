import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { Box, styled, Toolbar } from 'reakit';
import { prop } from 'styled-tools';
// import { Link, Logo } from '../elements';
// import { ComponentProps } from '../types';

const StyledBox = styled(Box)`
  background-color: ${prop('theme.gray1')};
`;

const StyledToolbar = styled(Toolbar)`
  background-color: ${prop('theme.gray2')};
`;

const Page = styled(Toolbar.Content)`
  white-space: nowrap;
`;

const NavigationLink = styled(RouterLink)`
  display: flex;
  align-items: center;
  font-size: 15px;
  height: 100%;
  width: 100%;
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

export const Sidebar = () => (
  <StyledBox>
    <StyledToolbar>
      <Page>
        <Toolbar.Focusable data-test="docs-getting-started-sidebar" as={NavigationLink} to="/docs/getting-started">
          Getting Started
        </Toolbar.Focusable>
      </Page>
    </StyledToolbar>
  </StyledBox>
);
