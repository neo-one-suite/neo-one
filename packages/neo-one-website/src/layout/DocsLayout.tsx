import React from 'react';
import { Flex, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { DocFooter, Header } from '../components';
import { ComponentProps } from '../types';
import { AdjacentInfo } from '../utils';

const Wrapper = styled(Flex)`
  &&& {
    flex-direction: column;
    background-color: ${prop('theme.gray0')};
    color: ${prop('theme.black')};
    height: 100%;
    width: 100%;
  }
`;

const StyledGrid = styled(Grid)`
  grid-template-columns: 8fr 2fr;
  height: 100%;
  padding-top: 80px;
  padding-left: 20%;
  padding-right: 20%;
  overflow-wrap: break-word;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

const StyledHeader = styled(Header)`
  flex: 0 0 auto;
  width: 100%;
  position: fixed;
`;

interface Props {
  readonly children: React.ReactNode;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}
export const DocsLayout = ({ children, next, previous, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledHeader />
    <StyledGrid>{children}</StyledGrid>
    <DocFooter next={next} previous={previous} />
  </Wrapper>
);
