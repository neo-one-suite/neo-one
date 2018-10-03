// tslint:disable no-any
import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { as, Flex, styled, Toolbar } from 'reakit';
import { prop } from 'styled-tools';
import { LineLogoPrimary, Link } from '../../elements';
import { ComponentProps } from '../../types';

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

const StyledLink = styled(Link)`
  &&& {
    color: ${prop('theme.primary')};

    &:hover {
      color: ${prop('theme.primaryDark')};
    }
  }
`;

export const CourseHeader = (props: ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledToolbar>
      <Toolbar.Content>
        <LogoLink to="/course">
          <LineLogoPrimary />
        </LogoLink>
      </Toolbar.Content>
      <Toolbar.Content align="end">
        <Toolbar.Focusable as={StyledLink} href="/" target="_blank">
          Docs
        </Toolbar.Focusable>
      </Toolbar.Content>
    </StyledToolbar>
  </Wrapper>
);
