import { ButtonBase } from '@neo-one/react-core';
import styled from 'styled-components';
import { prop } from 'styled-tools';

export const IconButton = styled(ButtonBase)`
  color: ${prop('theme.black')};
  outline: none;
  cursor: pointer;
  padding: 2px 2px;

  &:hover {
    background-color: rgba(46, 40, 55, 0.25);
  }
`;
