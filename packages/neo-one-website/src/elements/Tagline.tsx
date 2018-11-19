import { Image } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import tagline from '../../static/img/tagline.svg';

const StyledImage = styled(Image)`
  height: 80px;
`;

export const Tagline = (props: React.ComponentProps<typeof Image>) => (
  <StyledImage src={tagline} alt="Wake up NEO" {...props} />
);
