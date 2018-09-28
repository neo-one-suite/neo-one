import React from 'react';
import { Box, Flex, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Header, Sidebar } from '../components';
import { Markdown } from '../elements';
import { ComponentProps } from '../types';

const Wrapper = styled(Flex)`
  &&& {
    flex-direction: column;
    background-color: ${prop('theme.gray0')};
    color: ${prop('theme.black')};
    height: 100vh;
    width: 100%;
  }
`;

const StyledGrid = styled(Grid)`
  grid-template-columns: 2fr 8fr 3fr;
  height: 100vh;
`;

const Prebar = styled(Box)`
  background-color: ${prop('theme.gray0')};
`;

const StyledHeader = styled(Header)`
  flex: 0 0 auto;
`;

interface Props {
  readonly source: string;
}
export const DocsLayout = ({ source, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledHeader />
    <StyledGrid>
      <Prebar />
      <Markdown source={source} />
      <Sidebar />
    </StyledGrid>
  </Wrapper>
);
