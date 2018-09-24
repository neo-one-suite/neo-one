import React from 'react';
import { Flex, styled } from 'reakit';
import { prop } from 'styled-tools';
import { InteractiveHeader } from '../components';
import { ComponentProps } from '../types';

const Wrapper = styled(Flex)`
  flex-direction: column;
  background-color: ${prop('theme.black')};
  color: ${prop('theme.black')};
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const StyledHeader = styled(InteractiveHeader)`
  flex: 0 0 auto;
`;

const Content = styled(Flex)`
  flex: 1 1 auto;
  width: 100%;
`;

interface Props {
  readonly children: React.ReactNode;
}
export const InteractiveLayout = ({ children, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledHeader />
    <Content>{children}</Content>
  </Wrapper>
);
