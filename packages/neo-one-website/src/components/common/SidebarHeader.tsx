import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

interface Props {
  readonly title: string;
}

const Wrapper = styled(Box)`
  display: inline-block;
  border-bottom: 3px solid ${prop('theme.accent')};
  ${prop('theme.fonts.axiformaBold')};
  padding-top: 24px;
`;

export const SidebarHeader = ({ title, ...props }: Props) => (
  <Wrapper {...props}>
    {title}
    <MdArrowDropDown />
  </Wrapper>
);
