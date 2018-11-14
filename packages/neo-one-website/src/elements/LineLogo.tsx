import React from 'react';
import { Image, styled } from 'reakit';
import lineLogo from '../../static/img/lineLogo.svg';
import { ComponentProps } from '../types';

const StyledImage = styled(Image)`
  height: 24px;
`;

export const LineLogo = (props: ComponentProps<typeof Image>) => (
  <StyledImage src={lineLogo} alt="NEO•ONE" {...props} />
);
