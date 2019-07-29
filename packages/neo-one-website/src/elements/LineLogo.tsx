import styled from '@emotion/styled';
import { Image } from '@neo-one/react-common';
import React, { RefObject } from 'react';
import lineLogo from '../../static/img/lineLogo.svg';

const StyledImage = styled(Image)`
  height: 24px;
`;

interface Props extends React.ComponentProps<typeof Image> {
  readonly ref?: ((instance: HTMLImageElement | null) => void) | RefObject<HTMLImageElement> | null | undefined;
}

export const LineLogo = (props: Props) => <StyledImage src={lineLogo} alt="NEO•ONE" {...props} />;
