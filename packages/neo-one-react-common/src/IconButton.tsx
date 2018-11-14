import { Button, styled } from 'reakit';
import { prop } from 'styled-tools';

export const IconButton = styled(Button)`
  color: ${prop('theme.black')};
  outline: none;
  cursor: pointer;
  padding: 2px 2px;

  &:hover {
    background-color: rgba(46, 40, 55, 0.25);
  }
`;
