import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

export const ContentWrapperBase = styled(Grid)`
  max-width: 1260px;
  padding-left: 24px;
  padding-right: 24px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;
