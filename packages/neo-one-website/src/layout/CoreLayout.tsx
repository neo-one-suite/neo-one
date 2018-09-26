import * as React from 'react';
import { Box, Flex, styled } from 'reakit';
import { ifProp, prop } from 'styled-tools';
import { Footer, Header } from '../components';
import { ScrollContainer } from '../containers';
import { ComponentProps } from '../types';

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
  margin-top: 80px;
  width: 100%;
  background-color: ${prop('theme.gray0')};
`;

interface Props {
  readonly children: React.ReactNode;
}
export const CoreLayout = ({ children, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <ScrollContainer>{({ y }) => <StyledHeader shadowed={y > 0} />}</ScrollContainer>
    <Content>{children}</Content>
    <Footer />
  </Wrapper>
);
