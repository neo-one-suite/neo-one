// tslint:disable no-null-keyword
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { SidebarSpacer } from './SidebarSpacer';

const Wrapper = styled(Box)`
  display: grid;
  grid:
    'content' 'sidebar' auto
    / 1fr auto;
  padding-left: 16px;
  padding-right: 16px;
  width: 100%;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    padding-left: 40px;
    padding-right: 40px;
  }

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    width: 90%;
  }

  @media (min-width: ${prop('theme.breakpoints.lg')}) {
    max-width: 1280px;
  }
`;

interface Props {
  readonly omitSpacer?: boolean;
  readonly children: React.ReactNode;
}

export const LayoutWrapper = ({ children, omitSpacer = false, ...props }: Props) => (
  <Wrapper {...props}>
    {children}
    {omitSpacer ? null : <SidebarSpacer />}
  </Wrapper>
);
