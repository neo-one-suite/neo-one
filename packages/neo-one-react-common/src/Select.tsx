// tslint:disable no-any match-default-export-name
import styled from '@emotion/styled';
import { axiforma, theme } from '@neo-one/react-core';
import * as React from 'react';
import SelectBase from 'react-select';
import { prop } from 'styled-tools';

const StyledSelect = styled(SelectBase)<{}, {}>`
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

const styles = {
  option: (base: any, state: any) => ({
    ...base,
    color: theme.black,
    cursor: 'pointer',
    width: 'auto',
    backgroundColor: state.isSelected || state.isFocused ? '#9B98F6' : '#F8F5FD',
    opacity: state.isSelected ? 0.8 : state.isFocused ? 1 : undefined,
    fontSize: '0.875rem',
    lineHeight: '1.46428em',
    textAlign: 'left',
    fontFamily: axiforma('Axiforma-Regular'),
    fontStyle: 'normal',
    fontWeight: 400,
  }),
};

export function Select({ 'data-test': dataTest, ...props }: any) {
  return (
    <div data-test={dataTest}>
      <StyledSelect classNamePrefix="react-select" styles={styles} {...props} />
    </div>
  );
}
