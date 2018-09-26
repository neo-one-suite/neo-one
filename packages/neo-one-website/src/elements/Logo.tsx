import * as React from 'react';
import { Image, styled } from 'reakit';
import logo from '../../static/img/logo.svg';
import { ComponentProps } from '../types';

const StyledImage = styled(Image)`
  height: 56px;
`;

export const Logo = (props: ComponentProps<typeof Image>) => <StyledImage src={logo} alt="NEO•ONE" {...props} />;
