import styled from '@emotion/styled';
import { Image } from '@neo-one/react-core';
import React from 'react';
import monogram from '../static/img/monogram.svg';

const StyledImage = styled(Image)`
  height: 56px;
`;

export const Monogram = (props: React.ComponentPropsWithoutRef<typeof Image>) => (
  <StyledImage src={monogram} alt="NEO•ONE" {...props} />
);
