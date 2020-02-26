import styled from '@emotion/styled';
import { Box, ButtonBase, ifProp, prop, withProp } from '@neo-one/react-common';
import * as React from 'react';

const ButtonWrapper = styled(ButtonBase)`
  padding: 8px;
  cursor: pointer;
  outline: none;
`;

const Wrapper = styled(Box)`
  display: grid;
  align-items: start;
  gap: 4px;
  grid-auto-flow: column;
`;

// tslint:disable-next-line: no-any
const TextWrapper = styled(Box)<any>`
  color: ${ifProp('selected', prop('theme.gray0'), prop('theme.gray2'))};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  /* stylelint-disable-next-line */
  border-bottom: ${ifProp(
    'selected',
    withProp('theme.gray0', (color: string) => `1px solid ${color}`),
    '1px solid transparent',
  )};

  &:hover {
    color: ${prop('theme.gray0')};
  }
`;

interface Props {
  readonly onClick: () => void;
  readonly text: string;
  readonly children?: React.ReactNode;
  readonly selected: boolean;
}

export const ConsoleTab = ({ text, onClick, selected, children, ...props }: Props) => (
  <ButtonWrapper onClick={onClick} {...props}>
    <Wrapper>
      <TextWrapper selected={selected}>{text}</TextWrapper>
      {children}
    </Wrapper>
  </ButtonWrapper>
);
