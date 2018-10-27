import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

export const SidebarSpacer = styled(Box)`
  display: none;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    display: block;
    position: relative;
    height: 100%;
    margin-left: 80px;
    width: 204px;
  }

  @media (min-width: ${prop('theme.breakpoints.lg')}) {
    width: 300px;
  }
`;
