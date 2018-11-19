import { ButtonBase } from '@neo-one/react-core';
import * as React from 'react';
import styled from 'styled-components';
import { ifProp, prop, withProp } from 'styled-tools';
import { FileDisplay } from './FileDisplay';
import { File } from './types';

const Wrapper = styled(ButtonBase)<{ readonly first: boolean; readonly selected: boolean }>`
  color: ${ifProp('selected', prop('theme.gray0'), prop('theme.gray2'))};
  background-color: ${ifProp('selected', prop('theme.lightBlack'), prop('theme.gray5'))};
  ${prop('theme.fontStyles.body1')};
  padding: 8px;
  cursor: pointer;
  ${ifProp('first', '', withProp('theme.lightBlack', (color) => `border-left: 2px solid ${color}`))};
  outline: none;
  white-space: nowrap;
`;

interface Props {
  readonly first: boolean;
  readonly selected: boolean;
  readonly file: File;
  readonly omitReadOnly?: boolean;
  readonly onClick?: () => void;
}

export const FileTab = ({ first, file, selected, omitReadOnly, ...props }: Props) => (
  <Wrapper first={first} selected={selected} {...props}>
    <FileDisplay file={file} omitReadOnly={omitReadOnly} />
  </Wrapper>
);
