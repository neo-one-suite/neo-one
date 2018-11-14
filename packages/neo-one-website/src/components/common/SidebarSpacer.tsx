import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export const SidebarSpacer = styled(Box)`
  display: none;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    display: block;
    position: relative;
    height: 100%;
    margin-left: 40px;
    width: 196px;
  }

  @media (min-width: ${prop('theme.breakpoints.lg')}) {
    margin-left: 80px;
    width: 300px;
  }
`;
