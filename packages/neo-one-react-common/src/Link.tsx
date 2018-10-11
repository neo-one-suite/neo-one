import { Link as LinkBase, styled } from 'reakit';
import { prop, switchProp } from 'styled-tools';

export const Link = styled(LinkBase)<{ readonly linkColor: 'primary' | 'gray' }>`
  color: ${switchProp('linkColor', {
    primary: prop('theme.primary'),
    gray: prop('theme.gray6'),
  })};
  ${prop('theme.fonts.axiformaBold')};
  font-size: 14px;
  text-decoration: none;

  &:hover {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  &:focus {
    color: ${prop('theme.primaryDark')};
  }
`;
