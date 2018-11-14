// tslint:disable no-any
import { LineLogoPrimary, Link } from '@neo-one/react-common';
import * as React from 'react';
import { as, Flex, styled, Toolbar } from 'reakit';
import { prop } from 'styled-tools';
import { ComponentProps } from '../../types';
import { RouterLink } from '../RouterLink';

const Wrapper = styled(Flex)`
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

  ${/* sc-sel */ Toolbar.Focusable as any} {
    outline: none;
  }
`;

const FocusableRouterLink = as(RouterLink)(Toolbar.Focusable);

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

const FocusableLink: any = as(Link as any)(Toolbar.Focusable);

export const CourseHeader = (props: ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <Toolbar.Content>
        <LogoLink to="/course">
          <LineLogoPrimary />
        </LogoLink>
      </Toolbar.Content>
      <Toolbar.Content align="end">
        <FocusableLink linkColor="primary" href="/" target="_blank">
          Docs
        </FocusableLink>
      </Toolbar.Content>
    </StyledToolbar>
  </Wrapper>
);
