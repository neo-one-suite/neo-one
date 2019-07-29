// tslint:disable no-any
import styled from '@emotion/styled';
import { Select } from '@neo-one/react-common';
import * as React from 'react';
import { TypeFilterOption } from './TypeFilterOption';
import { TYPE_FILTER_OPTIONS, TypeFilterOptions } from './types';

const StyledSelect = styled(Select)`
  width: 144px;

  & > .react-select__control {
    background-color: white;
  }
`;

interface Props {
  readonly selected?: string;
  readonly onChange: (value: string) => void;
}

const createFormatOptionLabel = (option: TypeFilterOptions): React.ReactNode => <TypeFilterOption type={option} />;

export const TypeFilter = ({ selected, onChange, ...props }: Props) => (
  <StyledSelect
    {...props}
    formatOptionLabel={createFormatOptionLabel}
    placeholder="Select Type"
    value={selected}
    options={TYPE_FILTER_OPTIONS}
    onChange={onChange}
  />
);
