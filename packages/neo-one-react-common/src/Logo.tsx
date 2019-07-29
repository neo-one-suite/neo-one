import styled from '@emotion/styled';
import { Image } from '@neo-one/react-core';
import * as React from 'react';
import logo from '../static/img/logo.svg';

const StyledImage = styled(Image)`
  height: 56px;
`;

export const Logo = (props: React.ComponentPropsWithoutRef<typeof Image>) => (
  <StyledImage src={logo} alt="NEO•ONE" {...props} />
);
