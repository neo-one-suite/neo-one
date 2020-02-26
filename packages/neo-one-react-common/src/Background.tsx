import styled from '@emotion/styled';
import { Box } from '@neo-one/react-core';
import { prop } from 'styled-tools';
import background from '../static/img/background.svg';

export const Background = styled(Box)<typeof Box>`
  background-color: ${prop('theme.black')};
  background-image: url('${background}');
`;
