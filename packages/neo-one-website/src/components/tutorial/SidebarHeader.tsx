import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

const TitleBox = styled(Box)`
  display: inline-block;
  border-bottom: 3px solid transparent;
  border-color: ${prop('theme.accent')};
  ${prop('theme.fonts.axiformaMedium')};
  padding-top: 24px;
`;

export const SidebarHeader = () => (
  <TitleBox>
    Tutorial
    <MdArrowDropDown />
  </TitleBox>
);
