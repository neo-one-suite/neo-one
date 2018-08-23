import * as React from 'react';
import { styled, Tooltip } from 'reakit';
import { prop } from 'styled-tools';
import { ComponentProps } from '../types';

export const StyledTooltip = styled(Tooltip)`
  background-color: ${prop('theme.gray5')};
  border-color: ${prop('theme.gray5')};
  color: ${prop('theme.gray0')};
`;

export function ToolbarTooltip(props: ComponentProps<typeof StyledTooltip>) {
  return <StyledTooltip fade slide {...props} />;
}

export const ToolbarTooltipArrow = styled(Tooltip.Arrow)`
  color: ${prop('theme.gray5')};
`;
