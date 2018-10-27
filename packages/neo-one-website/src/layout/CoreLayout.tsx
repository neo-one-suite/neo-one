import * as React from 'react';
import { Box, Flex, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { Footer, Header } from '../components';
import { ScrollContainer } from '../containers';

const Wrapper = styled(Flex)`
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  width: 100%;
`;

const StyledHeader = styled(Header)<{ readonly shadowed: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  ${ifProp('shadowed', 'box-shadow: 0 0 1px rgba(0, 0, 0, 0.25)')};
`;

const Content = styled(Box)`
  margin-top: 72px;
  width: 100%;
  background-color: ${prop('theme.gray0')};

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    margin-top: 80px;
  }
`;

interface Props {
  readonly path: string;
  readonly content: boolean;
  readonly children: React.ReactNode;
}

export const CoreLayout = ({ children, path, content, ...props }: Props) => (
  <Wrapper {...props}>
    <ScrollContainer>{({ y }) => <StyledHeader path={path} shadowed={y > 0} />}</ScrollContainer>
    <Content>{children}</Content>
    <Footer content={content} />
  </Wrapper>
);
