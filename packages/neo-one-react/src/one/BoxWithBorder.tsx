import { as, Box, styled } from 'reakit';

export const BoxWithBorder = as('div')(styled(Box)`
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 0.25em;
`);
