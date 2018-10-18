import { as, Box, styled } from 'reakit';

export const Fit = as('div')(styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`);
