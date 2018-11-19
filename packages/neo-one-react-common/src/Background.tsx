import { Box } from '@neo-one/react-core';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import background from '../static/img/background.svg';

export const Background = styled(Box)`
  background-color: ${prop('theme.black')};
  background-image: url('${background}');
`;
