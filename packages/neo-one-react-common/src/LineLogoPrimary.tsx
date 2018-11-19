import { Image } from '@neo-one/react-core';
import React from 'react';
import styled from 'styled-components';
import lineLogoPrimary from '../static/img/lineLogoPrimary.svg';

const StyledImage = styled(Image)`
  height: 24px;
`;

export const LineLogoPrimary = (props: React.ComponentPropsWithoutRef<typeof Image>) => (
  <StyledImage src={lineLogoPrimary} alt="NEO•ONE" {...props} />
);
