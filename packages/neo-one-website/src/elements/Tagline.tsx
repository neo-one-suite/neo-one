import styled from '@emotion/styled';
import { Image } from '@neo-one/react-common';
import * as React from 'react';
import tagline from '../../static/img/tagline.svg';

const StyledImage = styled(Image)`
  height: 80px;
`;

interface Props extends React.ComponentProps<typeof Image> {
  readonly ref?: ((instance: HTMLImageElement | null) => void) | React.RefObject<HTMLImageElement> | null | undefined;
}

export const Tagline = (props: Props) => <StyledImage src={tagline} alt="Wake up NEO" {...props} />;
