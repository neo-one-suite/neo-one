import styled from '@emotion/styled';
import { ButtonBase } from '@neo-one/react-common';

export const Wrapper = styled(ButtonBase)`
  outline: none;
  cursor: pointer;
  padding: 2px 2px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }
`;
