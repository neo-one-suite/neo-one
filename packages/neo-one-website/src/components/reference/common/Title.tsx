// stylelint-disable
import { H2 } from '@neo-one/react-common';
import styled from 'styled-components';
import { ifProp, prop } from 'styled-tools';

export const Title = styled(H2)<{ readonly subheading?: boolean }>`
  ${prop('theme.fonts.axiformaBold')};
  ${ifProp('subheading', prop('theme.fontStyles.headline'), prop('theme.fontStyles.display1'))};
`;
