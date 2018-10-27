import * as React from 'react';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';
import { LayoutWrapper } from './common';

const Wrapper = styled(Box)`
  background-color: ${prop('theme.black')};
  box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  height: 240px;
  width: 100%;
`;

interface Props {
  readonly content?: boolean;
}

export const Footer = ({ content = false, ...props }: Props) => {
  let footer = <Box />;
  if (content) {
    footer = <LayoutWrapper>{footer}</LayoutWrapper>;
  }

  return <Wrapper {...props}>{footer}</Wrapper>;
};
