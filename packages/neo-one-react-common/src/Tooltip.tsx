import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { PopoverArrow } from './PopoverArrow';
import { TooltipBase } from './TooltipBase';

export const StyledTooltip = styled(TooltipBase)`
  background-color: ${prop('theme.gray5')};
  border-color: ${prop('theme.gray5')};
  color: ${prop('theme.gray0')};
  padding: 8px;
`;

export function Tooltip(props: React.ComponentPropsWithoutRef<typeof StyledTooltip>) {
  return <StyledTooltip fade slide {...props} />;
}

export const TooltipArrow = PopoverArrow;
