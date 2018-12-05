import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { TypeIcon } from './common';
import { TypeFilterOptions } from './types';

interface Props {
  readonly type: TypeFilterOptions;
}

const StyledBox = styled(Box)`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaRegular')};
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
  gap: 8px;
`;

export const TypeFilterOption = ({ type, ...props }: Props) => (
  <Wrapper {...props}>
    <TypeIcon type={type} />
    <StyledBox>{type}</StyledBox>
  </Wrapper>
);
