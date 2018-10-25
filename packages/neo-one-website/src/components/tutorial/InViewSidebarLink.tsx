import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { SidebarLink } from '../common';

export interface InViewAPI {
  readonly inViewY: (elem: HTMLElement | null) => boolean;
}

export const InViewSidebarLink = styled(SidebarLink)`
  border-left: 3px solid ${prop('theme.accent')};
`;
