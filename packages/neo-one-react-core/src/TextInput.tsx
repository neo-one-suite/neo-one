import styled from '@emotion/styled';
import { prop } from 'styled-tools';
import { Input } from './Input';

export const TextInput = styled(Input)`
  padding: 0 4px;
  outline: none;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  background-color: white;
  height: 40px;
  border: 1px solid rgba(0, 0, 0, 0.2);

  &:hover {
    border: 1px solid rgba(0, 0, 0, 0.3);
  }

  &:focus {
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
`;
