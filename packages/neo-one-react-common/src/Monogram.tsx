import React from 'react';
import { Image, styled } from 'reakit';
import monogram from '../static/img/monogram.svg';
import { ComponentProps } from './types';

const StyledImage = styled(Image)`
  height: 56px;
`;

export const Monogram = (props: ComponentProps<typeof Image>) => (
  <StyledImage src={monogram} alt="NEO•ONE" {...props} />
);
