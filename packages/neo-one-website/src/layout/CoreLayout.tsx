import * as React from 'react';
// @ts-ignore
import Headroom from 'react-headroom';
import { Box, Flex, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Footer, Header } from '../components';

const Wrapper = styled(Flex)`
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  width: 100%;
`;

const StyledHeadroom = styled(Headroom)`
  width: 100%;
  z-index: 9999;
`;

const Content = styled(Box)`
  width: 100%;
  background-color: ${prop('theme.gray0')};
`;

interface Props {
  readonly path: string;
  readonly content: boolean;
  readonly children: React.ReactNode;
}

export const CoreLayout = ({ children, path, content, ...props }: Props) => (
  <Wrapper {...props}>
    <StyledHeadroom>
      <Header path={path} />
    </StyledHeadroom>
    <Content>{children}</Content>
    <Footer content={content} />
  </Wrapper>
);
