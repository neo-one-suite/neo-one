import * as React from 'react';
import { Image, styled } from 'reakit';
import tagline from '../../static/img/tagline.svg';
import { ComponentProps } from '../types';

const StyledImage = styled(Image)`
  height: 80px;
`;

export const Tagline = (props: ComponentProps<typeof Image>) => (
  <StyledImage src={tagline} alt="Wake up NEO" {...props} />
);
