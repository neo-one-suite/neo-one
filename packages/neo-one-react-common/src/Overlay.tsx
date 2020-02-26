// tslint:disable no-object-mutation
import styled from '@emotion/styled';
import { ColorProps } from '@neo-one/react-core';
import { theme } from 'styled-tools';
import { Hidden } from './Hidden';

export const Overlay = styled(Hidden)<ColorProps>`
  position: fixed;
  z-index: 19900410;
  left: 50%;
  top: 50%;
  ${theme('Overlay')};
`;

Overlay.defaultProps = {
  role: 'dialog',
  'aria-modal': true,
  hideOnEsc: true,
  translateX: '-50%',
  translateY: '-50%',
  defaultSlide: 'top',
  opaque: true,
  palette: 'background',
  tone: -1,
};
