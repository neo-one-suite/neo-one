// tslint:disable no-any
import styled from '@emotion/styled';
import { Input } from '@neo-one/react-core';
import * as React from 'react';
import { prop } from 'styled-tools';

const StyledInput = styled(Input.withComponent('select'))<{}, {}>`
  background-color: ${prop('theme.gray0')};
  outline: none;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  height: 1.46428em;
`;

interface Props {
  readonly options: readonly string[];
  readonly selected?: string;
  readonly onChange: (value: string) => void;
}

export const Selector = ({ options, selected, onChange, ...props }: Props) => (
  // tslint:disable-next-line no-any
  <StyledInput {...props} value={selected} onChange={(event: any) => onChange(event.target.value)}>
    {options.map((option) => (
      <option key={option}>{option}</option>
    ))}
  </StyledInput>
);
