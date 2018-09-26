import React from 'react';
import { Image, styled } from 'reakit';
import lineLogoPrimary from '../../static/img/lineLogoPrimary.svg';
import { ComponentProps } from '../types';

const StyledImage = styled(Image)`
  height: 24px;
`;

export const LineLogoPrimary = (props: ComponentProps<typeof Image>) => (
  <StyledImage src={lineLogoPrimary} alt="NEO•ONE" {...props} />
);
