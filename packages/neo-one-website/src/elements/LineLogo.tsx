import { Image } from '@neo-one/react-common';
import React from 'react';
import styled from 'styled-components';
import lineLogo from '../../static/img/lineLogo.svg';

const StyledImage = styled(Image)`
  height: 24px;
`;

export const LineLogo = (props: React.ComponentProps<typeof Image>) => (
  <StyledImage src={lineLogo} alt="NEO•ONE" {...props} />
);
