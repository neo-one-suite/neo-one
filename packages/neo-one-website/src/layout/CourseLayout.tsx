import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import React from 'react';
import { prop } from 'styled-tools';
import { CourseHeader } from '../components';

const Wrapper = styled(Box)<{}, {}>`
  &&& {
    display: flex;
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
export const CourseLayout = ({ children, ...props }: Props & React.ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <StyledHeader />
    {children}
  </Wrapper>
);
