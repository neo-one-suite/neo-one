import * as React from 'react';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';

const Wrapper = styled(Box)`
  background-color: ${prop('theme.black')};
  box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  height: 240px;
  width: 100%;
`;

export const Footer = () => <Wrapper />;
