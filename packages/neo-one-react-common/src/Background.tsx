import { styled } from 'reakit';
import { prop } from 'styled-tools';
import background from '../static/img/background.svg';

export const Background = styled.div`
  background-color: ${prop('theme.black')};
  background-image: url('${background}');
`;
