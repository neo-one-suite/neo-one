import { Button as ButtonBase, styled } from 'reakit';
import { prop } from 'styled-tools';

export const Button = styled(ButtonBase)`
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
