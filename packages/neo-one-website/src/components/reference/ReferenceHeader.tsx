import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Example } from './Example';
import { TypeIcon } from './TypeIcon';
import { ReferenceType, WordTokens } from './types';
import { buildText } from './utils';

interface Props {
  readonly type: ReferenceType;
  readonly description: WordTokens;
  readonly definition: WordTokens;
}

const Wrapper = styled(Box)`
  display: grid;
  gap: 16px;
`;

const Description = styled(Box)`
  ${prop('theme.fontStyles.body1')};
  ${prop('theme.fonts.axiformaRegular')};
`;

export const ReferenceHeader = ({ type, description, definition, ...props }: Props) => (
  <Wrapper {...props}>
    <TypeIcon type={type} fullIcon />
    <Description>{buildText(description)}</Description>
    <Example example={definition} />
  </Wrapper>
);
