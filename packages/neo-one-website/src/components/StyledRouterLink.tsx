import { styledOmitProps } from '@neo-one/react-common';
import styled from 'styled-components';
import { prop, switchProp } from 'styled-tools';
import { RouterLink } from './RouterLink';

interface StyledRouterLinkBaseProps {
  readonly linkColor: 'primary' | 'gray' | 'accent' | 'light';
}

export const StyledRouterLinkBase = styledOmitProps<StyledRouterLinkBaseProps>(RouterLink, ['linkColor'])`
color: ${switchProp('linkColor', {
  primary: prop('theme.primary'),
  accent: prop('theme.accent'),
  gray: prop('theme.gray6'),
  light: prop('theme.gray1'),
})};
text-decoration: none;

&:hover {
  color: ${prop('theme.primaryDark')};
  text-decoration: none;
}

&:focus {
  color: ${prop('theme.primaryDark')};
  text-decoration: none;
}

&:active {
  color: ${prop('theme.primaryDark')};
  text-decoration: none;
}
`;

export const StyledRouterLink = styled(StyledRouterLinkBase)`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.body1')};
`;
