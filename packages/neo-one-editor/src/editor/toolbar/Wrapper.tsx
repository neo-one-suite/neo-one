import { Button, styled } from 'reakit';

export const Wrapper = styled(Button)`
  outline: none;
  cursor: pointer;
  padding: 2px 2px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }
`;
