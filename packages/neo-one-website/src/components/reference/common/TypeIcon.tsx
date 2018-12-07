// stylelint-disable
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { ifProp, prop, switchProp } from 'styled-tools';
import { TypeFilterOptions } from '../types';

interface Props {
  readonly type: TypeFilterOptions;
  readonly fullIcon?: boolean;
}

const IconBox = styled(Box)<{ readonly bg: TypeFilterOptions; readonly fullIcon: boolean }>`
  background-color: ${switchProp('bg', {
    All: 'transparent',
    Class: prop('theme.primary'),
    Const: prop('theme.gray6'),
    Function: prop('theme.warning'),
    Interface: prop('theme.accent'),
    Enum: prop('theme.gray3'),
    Decorator: prop('theme.error'),
    'Type Alias': prop('theme.secondary'),
  })};
  color: ${switchProp(
    'bg',
    {
      All: 'transparent',
    },
    prop('theme.gray0'),
  )};
  ${prop('theme.fontStyles.body2')};
  ${prop('theme.fonts.axiformaBold')};
  border-radius: 2px;
  width: ${ifProp('fullIcon', '80px', '24px')};
  height: 24px;
  text-align: center;
  padding-top: 2px;
`;

const letterIcon = (type: TypeFilterOptions) => (type === 'Const' ? 'K' : type.charAt(0));

export const TypeIcon = ({ type, fullIcon = false, ...props }: Props) => (
  <IconBox bg={type} fullIcon={fullIcon} {...props}>
    {fullIcon ? type : letterIcon(type)}
  </IconBox>
);
