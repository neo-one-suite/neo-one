import React from 'react';
import { Flex, styled } from 'reakit';
import { prop } from 'styled-tools';
import { CourseHeader } from '../components';
import { ComponentProps } from '../types';

const Wrapper = styled(Flex)`
  &&& {
    flex-direction: column;
    background-color: ${prop('theme.black')};
    color: ${prop('theme.black')};
    min-height: 100vh;
    width: 100%;
  }
`;

const StyledHeader = styled(CourseHeader)`
  flex: 0 0 auto;
`;

interface Props {
  readonly children: React.ReactNode;
}
export const CourseLayout = ({ children, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledHeader />
    {children}
  </Wrapper>
);
