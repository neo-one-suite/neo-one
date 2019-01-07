// tslint:disable no-any
import { Input } from '@neo-one/react-core';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';

const StyledInput = styled(Input)`
  background-color: ${prop('theme.gray0')};
  outline: none;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  height: 1.46428em;
`;

interface Props {
  readonly options: ReadonlyArray<string>;
  readonly selected?: string;
  readonly onChange: (value: string) => void;
}

export const Selector = ({ options, selected, onChange, ...props }: Props) => (
  <StyledInput
    {...props}
    as="select"
    value={selected}
    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
  >
    {options.map((option) => (
      <option key={option}>{option}</option>
    ))}
  </StyledInput>
);
