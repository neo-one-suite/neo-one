import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { WordTokens } from '../types';
import { buildText } from './utils';

export const StyledText = styled(Box)`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaRegular')};
`;

interface Props {
  readonly text: WordTokens;
}

export const Text = ({ text, ...props }: Props) => <StyledText {...props}>{buildText(text)}</StyledText>;
