import * as React from 'react';
import Select from 'react-select';
import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { ComponentProps } from '../types';

// tslint:disable-next-line:no-any
const StyledSelect: React.ComponentType<ComponentProps<Select<any>>> = styled(Select)`
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-color: ${prop('theme.gray0')};
  outline: none;

  & > .react-select__control {
    background-color: ${prop('theme.gray0')};
    border: 0;
    border-radius: 0;
    box-shadow: none;
    cursor: pointer;

    &:hover {
      border: 0;
      box-shadow: inset 0 0 999em rgba(0, 0, 0, 0.1);
    }

    & > .react-select__indicators {
      & > .react-select__indicator-separator {
        background-color: ${prop('theme.black')};
        opacity: 0.2;
      }

      & > .react-select__indicator {
        color: ${prop('theme.black')};
      }
    }
  }

  & .react-select__menu {
    background-color: ${prop('theme.gray0')};
    width: auto;

    & .react-select__option {
      color: ${prop('theme.black')};
      cursor: pointer;
    }

    & .react-select__option.react-select__option--is-selected {
      background-color: ${prop('theme.accent')};
      opacity: 0.8;
    }

    & .react-select__option.react-select__option--is-focused {
      background-color: ${prop('theme.accent')};
      opacity: 1;
    }
  }
`;

export function Selector<OptionType>({
  'data-test': dataTest,
  ...props
}: ComponentProps<Select<OptionType>> & { readonly 'data-test': string }) {
  return (
    <div data-test={dataTest}>
      <StyledSelect classNamePrefix="react-select" {...props} />
    </div>
  );
}
