import styled from '@emotion/styled';
import { prop } from 'styled-tools';
import { ButtonBase } from './ButtonBase';
import { ColorProps } from './styledProps';

export const Button = styled(ButtonBase)<typeof ButtonBase & ColorProps>`
  background-color: ${prop('theme.accent')};
  border: none;
  border-radius: 24px;
  color: ${prop('theme.gray5')};
  padding-bottom: 12px;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 12px;
  text-align: center;
  text-transform: none;
  font-size: 0.875rem;
  line-height: 1em;
  transition: 0.3s;
  cursor: pointer;
  text-decoration: none;
  outline: none;
  white-space: nowrap;

  &:hover {
    background-color: ${prop('theme.primaryLight')};
  }

  &:active {
    background-color: ${prop('theme.primaryLight')};
    outline: none;
  }

  &:focus {
    background-color: ${prop('theme.primaryLight')};
    outline: none;
  }
`;

// tslint:disable-next-line:no-object-mutation
Button.defaultProps = {
  opaque: true,
  palette: 'primary',
};
