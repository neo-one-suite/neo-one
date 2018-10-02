// tslint:disable no-any
import * as React from 'react';
import { Input, styled } from 'reakit';
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

export const Selector = ({ options, selected, onChange }: Props) => (
  <StyledInput as="select" value={selected} onChange={(event) => onChange((event.target as any).value)}>
    {options.map((option) => (
      <option key={option}>{option}</option>
    ))}
  </StyledInput>
);
