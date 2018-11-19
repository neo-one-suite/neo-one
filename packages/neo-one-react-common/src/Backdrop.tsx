import styled from 'styled-components';
import { theme } from 'styled-tools';
import { Hidden } from './Hidden';

export const Backdrop = styled(Hidden)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 998;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -moz-tap-highlight-color: rgba(0, 0, 0, 0);
  ${theme('Backdrop')};
`;

// tslint:disable-next-line:no-object-mutation
Backdrop.defaultProps = {
  role: 'button',
  tabIndex: -1,
  opaque: true,
  palette: 'shadow',
  tone: 2,
};
